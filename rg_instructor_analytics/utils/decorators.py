"""
Util decorators.
"""
import logging
from functools import wraps

from django.http import HttpResponseBadRequest, HttpResponseForbidden
from django.utils.decorators import available_attrs
from django.utils.translation import ugettext as _
from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey

from courseware.access import has_access
from courseware.courses import get_course
from student.roles import GlobalStaff, OrgInstructorRole

log = logging.getLogger(__name__)


def instructor_access_required(view_func):
    """
    Instructor access check decorator.

    Decorator for views that checks the user is logged in and has instructor access
    to the course with given course_id.
    """
    role = 'instructor'

    @wraps(view_func, assigned=available_attrs(view_func))
    def _wrapped_view(request, *args, **kwargs):
        course_id = request.POST.get('course_id') or kwargs.get('course_id')
        try:
            course_key = CourseKey.from_string(course_id)
            course = get_course(course_key)
            if not has_access(request.user, role, course):
                return HttpResponseForbidden(reason='Instructors only!')
            return view_func(request, *args, **kwargs)

        except InvalidKeyError:
            log.error(
                "Unable to find course with course key %s while loading the Instructor Analytics dashboard.",
                course_id
            )
            return HttpResponseBadRequest(reason=_("Invalid course ID."))
        except ValueError as exc:
            log.error(exc.message, course_id)
            return HttpResponseBadRequest(reason=exc.message)
    return _wrapped_view


def instructor_access_required_without_course(view_func):
    """
    Instructor access check decorator.

    Decorator for views that checks the user is logged in and has staff or instructor access.
    """

    @wraps(view_func, assigned=available_attrs(view_func))
    def _wrapped_view(request, *args, **kwargs):
        org = request.POST.get('org', '')

        # global staff, org instructors, and course instructors have all permissions:
        if GlobalStaff().has_user(request.user) or OrgInstructorRole(org=org).has_user(request.user):
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden(reason='Instructors only!')
    return _wrapped_view
