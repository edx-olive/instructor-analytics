"""
Util package.
"""
import os

import pkg_resources
from django.db.models import Count
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview

from student.models import CourseEnrollment, UserProfile

def resource_string(path):
    """
    Handy helper for getting resources.
    """
    data = pkg_resources.resource_string(
        __name__,
        os.path.join('..', 'static', 'rg_instructor_analytics', path)
    )
    return data.decode("utf8")


def choices_value_by_key(choices, key):
    result = [c for c in choices if c[0] == key]
    return result[0][1] if result else ''


def get_microsite_courses(site):
    """
    Finds all Courses which are related to given Site.
    :param site: Site
    :return: (list) CourseLocator objects
    """
    courses = CourseOverview.objects.values_list('id', flat=True)

    site_configuration = getattr(site, "configuration", None)
    if not site_configuration:
        return courses

    course_org_filter = site_configuration.get_value('course_org_filter')
    if not course_org_filter:
        return courses

    if course_org_filter and not isinstance(course_org_filter, list):
        course_org_filter = [course_org_filter]

    return courses.filter(org__in=course_org_filter)


def get_courses_learners(courses_ids):
    """
    Determine all Course learners.
    :param courses_ids: CourseOverview ids
    :return: (set) User ids
    """
    user_ids = (
        CourseEnrollment.objects
        .filter(course_id__in=courses_ids, is_active=True)
        .values_list('user', flat=True)
    )
    return set(user_ids) if user_ids else set()


def aggregate_users_stats(users_ids, metrics):
    """
    Calculate aggregated stats on given users data sample.
    :param users_ids: (set | list) User ids
    :param metrics: UserProfile field name
    :return: (dict)
    """
    if metrics not in [f.name for f in UserProfile._meta.fields]:
        raise ValueError('`metrics` argument must be UserProfile field name!')

    metrics_counts = (
        UserProfile.objects
        .filter(user_id__in=users_ids)
        .values(metrics)
        .annotate(count=Count('*'))
    )
    stats = {(count_dict[metrics] or 'empty'): count_dict['count'] for count_dict in metrics_counts}
    stats['total'] = sum(stats.values())
    stats.setdefault('empty', 0)
    return stats
