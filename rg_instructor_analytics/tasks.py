"""
Module for celery tasks.
"""
from collections import OrderedDict
from datetime import date, datetime
import json
import logging

from celery.schedules import crontab
from celery.task import periodic_task, task
from lms.djangoapps.courseware.courses import get_course_by_id
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.core.exceptions import PermissionDenied
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import F
from django.http.response import Http404
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey
from xmodule.modulestore.django import modulestore

from common.djangoapps.student.models import CourseEnrollment
from lms.djangoapps.courseware.models import StudentModule
from lms.djangoapps.grades.course_grade_factory import CourseGradeFactory
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview
from openedx.core.djangoapps.site_configuration import helpers as configuration_helpers
from rg_instructor_analytics.models import (
    AgeStats, EducationStats, GenderStats, GradeStatistic, LastGradeStatUpdate, ResidenceStats
)
from rg_instructor_analytics.utils import aggregate_users_stats, get_courses_learners, get_microsite_courses
from rg_instructor_analytics.utils import juniper_specific as specific

log = logging.getLogger(__name__)
DEFAULT_DATE_TIME = datetime(2000, 1, 1, 0, 0)


@task
def send_email(subject, message, students):
    """
    Send email task.
    """
    context = {'subject': subject, 'body': message}
    html_content = render_to_string('rg_instructor_analytics/send_email.html', context)
    text_content = strip_tags(html_content)
    from_address = configuration_helpers.get_value('email_from_address', settings.DEFAULT_FROM_EMAIL)
    msg = EmailMultiAlternatives(subject, text_content, from_address, [], bcc=students)
    msg.encoding = 'UTF-8'
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


def get_items_for_grade_update():
    """
    Return an aggregate list of the users by the course, those grades need to be recalculated.
    """
    last_update_info = LastGradeStatUpdate.objects.last()
    # For first update we what get statistic for all enrollments,
    # otherwise - generate diff, based on the student activity.
    if last_update_info:
        items_for_update = list(
            StudentModule.objects
            .filter(module_type__exact='problem', modified__gt=last_update_info.last_update)
            .values('student__id', 'course_id')
            .order_by('student__id', 'course_id')
            .distinct()
        )
        items_for_update += list(
            CourseEnrollment.objects
            .filter(created__gt=last_update_info.last_update)
            .values('user__id', 'course_id')
            .annotate(student__id=F('user__id'))
            .values('student__id', 'course_id')
            .distinct()
        )
        # Remove records for students who never enrolled
        for item in items_for_update:
            try:
                course_key = specific.get_course_key(item['course_id'])
            except InvalidKeyError:
                continue
            enrolled_by_course = CourseEnrollment.objects.filter(
                course_id=course_key
            ).values_list('user__id', flat=True)
            if item['student__id'] not in enrolled_by_course:
                items_for_update.remove(item)

    else:
        items_for_update = (
            CourseEnrollment.objects
            .values('user__id', 'course_id')
            .annotate(student__id=F('user__id'))
            .values('student__id', 'course_id')
            .distinct()
        )

    users_by_course = {}
    for item in items_for_update:
        if item['course_id'] not in users_by_course:
            users_by_course[item['course_id']] = []
        users_by_course[item['course_id']].append(item['student__id'])
    return users_by_course


def get_grade_summary(user_id, course):
    """
    Return the grade for the given student in the addressed course.
    """
    try:
        return CourseGradeFactory().read(User.objects.all().filter(id=user_id).first(), course).summary
    except PermissionDenied:
        return None


cron_grade_settings = getattr(
    settings, 'RG_ANALYTICS_GRADE_STAT_UPDATE',
    {
        'minute': str(settings.FEATURES.get('RG_ANALYTICS_GRADE_CRON_MINUTE', '0')),
        'hour': str(settings.FEATURES.get('RG_ANALYTICS_GRADE_CRON_HOUR', '*/6')),
        'day_of_month': str(settings.FEATURES.get('RG_ANALYTICS_GRADE_CRON_DOM', '*')),
        'day_of_week': str(settings.FEATURES.get('RG_ANALYTICS_GRADE_CRON_DOW', '*')),
        'month_of_year': str(settings.FEATURES.get('RG_ANALYTICS_GRADE_CRON_MONTH', '*')),
    }
)


@periodic_task(run_every=crontab(**cron_grade_settings))
def grade_collector_stat():
    """
    Task for update user grades.
    """
    this_update_date = datetime.now()
    logging.info('Task grade_collector_stat started at {}'.format(this_update_date))
    users_by_course = get_items_for_grade_update()

    collected_stat = []

    for course_string_id, users in users_by_course.items():
        try:
            course_key = CourseKey.from_string(str(course_string_id))
            course = get_course_by_id(course_key, depth=0)
        except (InvalidKeyError, Http404):
            continue

        with modulestore().bulk_operations(course_key):
            for user in users:
                grades = get_grade_summary(user, course)
                if not grades:
                    continue
                exam_info = OrderedDict()
                for grade in grades['section_breakdown']:
                    exam_info[grade['label']] = int(grade['percent'] * 100.0)
                exam_info['total'] = int(grades['percent'] * 100.0)

                collected_stat.append(
                    (
                        {'course_id': course_key, 'student_id': user},
                        {'exam_info': json.dumps(exam_info), 'total': grades['percent']}
                    )
                )

    with transaction.atomic():
        for key_values, additional_info in collected_stat:
            key_values['defaults'] = additional_info
            GradeStatistic.objects.update_or_create(**key_values)

        LastGradeStatUpdate(last_update=this_update_date).save()


@task
def run_common_static_collection():
    """
    Task for updating analytics data.
    """
    grade_collector_stat()


cron_demographics_settings = settings.FEATURES.get(
    'RG_ANALYTICS_DEMOGRAPHICS_SCHEDULE',
    {
        'minute': '0',
        'hour': '*/6',
        'day_of_month': '*',
        'day_of_week': '*',
        'month_of_year': '*',
    }
)


@periodic_task(run_every=crontab(**cron_demographics_settings))
def collect_demographics():
    """
    Master task to run a bunch of worker tasks for different User stats collection.
    """
    collect_gender_stats()
    collect_education_stats()
    collect_age_stats()
    collect_geo_stats()


@task
def collect_gender_stats():
    # Create daily record for each Site:
    for site in Site.objects.all():
        courses_ids = get_microsite_courses(site)
        users_ids = get_courses_learners(courses_ids)
        stats = aggregate_users_stats(users_ids, 'gender')

        GenderStats.objects.update_or_create(
            site=site,
            date=date.today(),
            defaults={
                'total': stats['total'],
                'empty': stats['empty'],
                'values': stats,
            }
        )

    # Create aggregated daily record (system-wide):
    all_courses_ids = CourseOverview.objects.values_list('id', flat=True)
    users_ids = get_courses_learners(all_courses_ids)
    stats = aggregate_users_stats(users_ids, 'gender')
    GenderStats.objects.update_or_create(
        date=date.today(),
        site=None,
        defaults={
            'total': stats['total'],
            'empty': stats['empty'],
            'values': stats,
        }
    )


@task
def collect_education_stats():
    # Create daily record for each Site:
    for site in Site.objects.all():
        courses_ids = get_microsite_courses(site)
        users_ids = get_courses_learners(courses_ids)
        stats = aggregate_users_stats(users_ids, 'level_of_education')

        EducationStats.objects.update_or_create(
            site=site,
            date=date.today(),
            defaults={
                'total': stats['total'],
                'empty': stats['empty'],
                'values': stats,
            }
        )

    # Create aggregated daily record (system-wide):
    all_courses_ids = CourseOverview.objects.values_list('id', flat=True)
    users_ids = get_courses_learners(all_courses_ids)
    stats = aggregate_users_stats(users_ids, 'level_of_education')
    EducationStats.objects.update_or_create(
        date=date.today(),
        site=None,
        defaults={
            'total': stats['total'],
            'empty': stats['empty'],
            'values': stats,
        }
    )


@task
def collect_age_stats():
    # Create daily record for each Site:
    for site in Site.objects.all():
        courses_ids = get_microsite_courses(site)
        users_ids = get_courses_learners(courses_ids)
        stats = aggregate_users_stats(users_ids, 'year_of_birth')

        AgeStats.objects.update_or_create(
            site=site,
            date=date.today(),
            defaults={
                'total': stats['total'],
                'empty': stats['empty'],
                'values': stats,
            }
        )

    # Create aggregated daily record (system-wide):
    all_courses_ids = CourseOverview.objects.values_list('id', flat=True)
    users_ids = get_courses_learners(all_courses_ids)
    stats = aggregate_users_stats(users_ids, 'year_of_birth')
    AgeStats.objects.update_or_create(
        date=date.today(),
        site=None,
        defaults={
            'total': stats['total'],
            'empty': stats['empty'],
            'values': stats,
        }
    )


@task
def collect_geo_stats():
    # Create daily record for each Site:
    for site in Site.objects.all():
        courses_ids = get_microsite_courses(site)
        users_ids = get_courses_learners(courses_ids)
        stats = aggregate_users_stats(users_ids, 'country')

        ResidenceStats.objects.update_or_create(
            site=site,
            date=date.today(),
            defaults={
                'total': stats['total'],
                'empty': stats['empty'],
                'values': stats,
            }
        )

    # Create aggregated daily record (system-wide):
    all_courses_ids = CourseOverview.objects.values_list('id', flat=True)
    users_ids = get_courses_learners(all_courses_ids)
    stats = aggregate_users_stats(users_ids, 'country')
    ResidenceStats.objects.update_or_create(
        date=date.today(),
        site=None,
        defaults={
            'total': stats['total'],
            'empty': stats['empty'],
            'values': stats,
        }
    )
