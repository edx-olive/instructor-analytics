"""
Manage.py command for updating old grades/ not synced
"""
import json
import logging
from collections import OrderedDict, defaultdict
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F
from django.http.response import Http404
from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey

from courseware.courses import get_course_by_id
from courseware.models import StudentModule
from lms.djangoapps.grades.course_grade_factory import CourseGradeFactory
from rg_instructor_analytics.models import GradeStatistic, LastGradeStatUpdate
from rg_instructor_analytics.utils.constants import NON_GRADED_MODULE_TYPES
from student.models import CourseEnrollment
from xmodule.modulestore.django import modulestore


log = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Command for updating missed/outdated grades for the rg_instructor_analytics.
    """

    help = """
    Run command to sync outdated/missed grades required for analytics.

    Attention - the first run of the collecting grades may take several hours.
    """

    def add_arguments(self, parser):
        parser.add_argument('course_id', nargs='*', help='Sync/Update grades for courses.')

    def handle(self, *args, **options):
        """
        Handle command.
        """
        if not options['course_id']:
            course_keys = [course.id for course in modulestore().get_courses()]
        else:
            course_keys = [CourseKey.from_string(arg) for arg in options['course_id']]

        if not course_keys:
            log.fatal('No courses specified.')
            return

        this_update_date = datetime.now()
        log.info('Sync grades started at {}'.format(this_update_date))

        items_for_update = []
        for course_key in course_keys:
            items_for_update += list(
                StudentModule.objects.filter(course_id__exact=course_key)
                .exclude(module_type__in=NON_GRADED_MODULE_TYPES)
                .values('student__id', 'course_id')
                .order_by('student__id', 'course_id')
                .distinct()
            )

            items_for_update += list(
                CourseEnrollment.objects.filter(course_id__exact=course_key)
                .values('user__id', 'course_id')
                .annotate(student__id=F('user__id'))
                .values('student__id', 'course_id')
                .distinct()
            )

        users_by_course = defaultdict(list)
        for item in items_for_update:
            users_by_course[item['course_id']].append(item['student__id'])

        collected_stat = []
        for course_string_id, users in users_by_course.iteritems():
            try:
                course_key = CourseKey.from_string(str(course_string_id))
                course = get_course_by_id(course_key, depth=0)
            except (InvalidKeyError, Http404):
                continue

            with modulestore().bulk_operations(course_key):
                for user in users:
                    grades = CourseGradeFactory().read(User.objects.all().filter(id=user).first(), course).summary
                    if not grades:
                        continue
                    exam_info = OrderedDict()
                    for grade in grades['section_breakdown']:
                        exam_info[grade['label']] = int(grade['percent'] * 100.0)
                    exam_info['total'] = int(grades['percent'] * 100.0)

                    collected_stat.append(
                        (
                            {'course_id': course_key, 'student_id': user},
                            {'exam_info': json.dumps(exam_info), 'total': grades['percent']},
                        )
                    )

        with transaction.atomic():
            for key_values, additional_info in collected_stat:
                key_values['defaults'] = additional_info
                GradeStatistic.objects.update_or_create(**key_values)

            LastGradeStatUpdate(last_update=this_update_date).save()
