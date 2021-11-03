"""
Module for tab fragment.
"""
import json
from time import mktime

from django.http import Http404
from django.shortcuts import render_to_response
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import ensure_csrf_cookie
from opaque_keys.edx.keys import CourseKey
from rg_instructor_analytics_log_collector.models import EnrollmentByDay

from common.djangoapps.student.models import CourseAccessRole
from common.djangoapps.util.views import ensure_valid_course_key
from lms.djangoapps.courseware.courses import get_course_by_id
from lms.djangoapps.instructor import permissions
from lms.djangoapps.instructor.views.api import require_course_permission
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview
from rg_instructor_analytics.models import InstructorTabsConfig


can_access = require_course_permission(permissions.CAN_RESEARCH)


TABS = (
    {
        'field': 'enrollment_stats',
        'class': 'enrollment-stats',
        'section': 'enrollment_stats',
        'title': _('Enrollment stats'),
        'template': 'enrollment_stats.html'
    },
    {
        'field': 'activities',
        'class': 'activity',
        'section': 'activity',
        'title': _('Activities'),
        'template': 'activity.html'
    },
    {
        'field': 'problems',
        'class': 'problems',
        'section': 'problems',
        'title': _('Problems'),
        'template': 'problems.html'
    },
    {
        'field': 'students_info',
        'class': 'gradebook',
        'section': 'gradebook',
        'title': _('Students\' Info'),
        'template': 'gradebook.html'
    },
    {
        'field': 'clusters',
        'class': 'cohort',
        'section': 'cohort',
        'title': _('Clusters'),
        'template': 'cohort.html'
    },
    {
        'field': 'progress_funnel',
        'class': 'funnel',
        'section': 'cohort',
        'title': _('Progress Funnel'),
        'template': 'funnel.html'
    },
    {
        'field': 'suggestions',
        'class': 'suggestion',
        'section': 'cohort',
        'title': _('Suggestions'),
        'template': 'suggestion.html'
    },
    {
        'field': 'add_info',
        'class': 'add-info',
        'section': 'cohort',
        'title': _('Additional Information'),
        'template': 'add-info.html'
    },
)


def get_enroll_info(course):
    """
    Return enroll_start for given course.
    """
    enrollment_by_day = EnrollmentByDay.objects.filter(course=course.id).order_by('day').first()
    enroll_start = enrollment_by_day and enrollment_by_day.day

    return {
        'enroll_start': mktime(enroll_start.timetuple()) if enroll_start else 'null',
    }


def get_staff_courses():
    """
    For staff user we need return all available courses on platform.
    """
    courses = []
    available_courses = CourseOverview.objects.all()
    for course in available_courses:
        try:
            courses.append(get_course_by_id(course.id, depth=0))
        except Http404:
            continue

    return courses


def get_instructor_courses(user):
    """
    Find courses, where User has permissions as Instructor or Course Staff.
    """
    courses = {}
    available_courses = CourseAccessRole.objects.filter(user=user, role__in=['instructor', 'staff'])
    for record in available_courses:
        try:
            course = get_course_by_id(record.course_id, depth=0)
            course_id = str(course.id)
            courses[course_id] = course
        except Http404:
            continue

    return list(courses.values())


def get_available_courses(user):
    """
    Return courses, available for the given User.
    """
    if user.is_staff:
        return get_staff_courses()

    return get_instructor_courses(user)


def get_course_dates_info(course):
    """
    Return course_start and course_is_started for given course.
    """
    return {
        'course_start': mktime(course.start.timetuple()) if course.start else 'null',
        'course_is_started': False if course.start and course.start > timezone.now() else True
    }


def make_api_path(tail_url_name, args):
    """
    Throws away the beginning part of API URL : e.g. <A/B/C> => <B/C>.
    """
    root = reverse('instructor_analytics_dashboard', args=args)
    tail = reverse(tail_url_name, args=args)
    return tail.replace(root, '')


@ensure_csrf_cookie
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@ensure_valid_course_key
@can_access
def instructor_analytics_dashboard(request, course_id):
    """
    Display the instructor dashboard for a course.
    """
    course_key = CourseKey.from_string(course_id)
    course = get_course_by_id(course_key, depth=0)

    enroll_info = {
        str(course_item.id): get_enroll_info(course_item)
        for course_item in get_available_courses(request.user)
    }

    available_courses = [
        {
            'course_id': str(user_course.id),
            'course_name': str(user_course.display_name),
            'is_current': course.id == user_course.id,
        }
        for user_course in get_available_courses(request.user)
    ]

    course_dates_info = {
        str(course_item.id): get_course_dates_info(course_item)
        for course_item in get_available_courses(request.user)
    }

    enabled_tabs = InstructorTabsConfig.tabs_for_user(request.user)
    tabs = [t for t in TABS if t['field'] in enabled_tabs]

    context = {
        'tabs': tabs,
        'course': course,
        'enroll_info': json.dumps(enroll_info),
        'available_courses': available_courses,
        'course_dates_info': json.dumps(course_dates_info),
        'api_urls': {
            'add_info': {
                'scopes': reverse('additional-info-scopes', args=[course_id]),
                'geo': reverse('additional-info-geo-stats', args=[course_id]),
                'gender': reverse('additional-info-gender-stats', args=[course_id]),
                'age': reverse('additional-info-age-stats', args=[course_id]),
                'education': reverse('additional-info-education-stats', args=[course_id]),
            }
        },
    }

    return render_to_response('rg_instructor_analytics/instructor_analytics_fragment.html', context)
