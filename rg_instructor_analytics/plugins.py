"""
Module for tabs description.
"""
from django.conf import settings
from django.core.files.storage import get_storage_class
from django.utils.translation import ugettext_noop

from lms.djangoapps.courseware.access import has_access
from lms.djangoapps.courseware.tabs import CourseTab
from openedx.core.djangoapps.site_configuration import helpers as configuration_helpers


class InstructorAnalyticsDashboardTab(CourseTab):
    """
    Provides information for tab.
    """

    name = "instructor_analytics"
    type = "instructor_analytics"
    title = ugettext_noop("Instructor analytics")
    body_class = "instructor-analytics-tab"
    is_dynamic = True
    fragment_view_name = 'rg_instructor_analytics.views.tab_fragment.instructor_analytics_dashboard'
    view_name = 'instructor_analytics_dashboard'

    @classmethod
    def is_enabled(cls, _, user=None):
        """
        Return true if the specified user has staff access.
        """
        return bool(
            user and
            # FIXME: it is restricted to have an access to the Instructor Analytics tab to course staff and admins
            #  for now. Only platform staff and admins have such access.
            has_access(user, 'staff', 'global', None) and
            configuration_helpers.get_value(
                'ENABLE_RG_INSTRUCTOR_ANALYTICS',
                settings.FEATURES.get('ENABLE_RG_INSTRUCTOR_ANALYTICS', False)
            )
        )

    def __init__(self, tab_dict):
        """
        Counstruct tab.
        """
        super().__init__(tab_dict)
        self._fragment_view = None

    @property
    def url_slug(self):
        """
        Return the slug to be included in this tab's URL.
        """
        return "tab/{}".format(self.type)

    @property
    def fragment_view(self):
        """
        Return the view that will be used to render the fragment.
        """
        if not self._fragment_view:
            self._fragment_view = get_storage_class(self.fragment_view_name)()
        return self._fragment_view

    def render_to_fragment(self, request, course, **kwargs):
        """
        Render this tab to a web fragment.
        """
        return self.fragment_view.render_to_fragment(request, course_id=str(course.id), **kwargs)
