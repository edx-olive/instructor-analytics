from django.apps import AppConfig
from edx_django_utils.plugins.constants import PluginSettings, PluginURLs

from openedx.core.constants import COURSE_ID_PATTERN


class RgInstructorAnalyticsAppConfig(AppConfig):
    name = 'rg_instructor_analytics'
    verbose_name = 'RG Instructor Analytics'

    plugin_app = {
        PluginURLs.CONFIG: {
            'lms.djangoapp': {
                # NOTE: PluginURLs.RELATIVE_PATH is not added since it is equal to PluginURLs.DEFAULT_RELATIVE_PATH
                PluginURLs.NAMESPACE: '',
                PluginURLs.REGEX: fr'^courses/{COURSE_ID_PATTERN}/rg_tab/instructor_analytics/',
            }
        },
        PluginSettings.CONFIG: {
            'lms.djangoapp': {
                'common': {},  # NOTE: 'relative_path' is omitted, it is equal to the default_relative_path 'settings'
            }
        },
    }
