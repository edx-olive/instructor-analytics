from collections import OrderedDict
import sys

from django.apps import apps
from django.conf import settings
from mock import MagicMock
import pytest


def _mock_non_installed_modules(*modules_list):
    for module_str in modules_list:
        submodule_str = None
        for part in module_str.split('.'):
            submodule_str = '.'.join([submodule_str, part] if submodule_str else [part])
            if submodule_str not in sys.modules:
                sys.modules[submodule_str] = MagicMock()


@pytest.fixture(scope="session", autouse=True)
def prepare_app_to_tests(request):
    """
    Break out dependencies from edx-platform.
    """
    _mock_non_installed_modules(
        'common.djangoapps.student.models',
        'common.djangoapps.util.views',
        'lms.djangoapps.courseware.access',
        'lms.djangoapps.courseware.courses',
        'lms.djangoapps.courseware.models',
        'lms.djangoapps.django_comment_client.utils',
        'lms.djangoapps.instructor.views.api',
        'openedx.core.djangoapps.xmodule_django',
        'openedx.core.djangoapps.content.course_overviews.models',
    )
    # TODO: rewrite rg_instructor_analytics_log_collector with CourseKeyField from opaque_keys and remove keys mocking
    # For CourseKeyField class
    # openedx.core.djangoapps.xmodule_django.models.CourseKeyField
    # is wrapper around opaque_keys.edx.django.models.CourseKeyField with deprecation warning
    import opaque_keys.edx.django.models  # noqa: F401 to get from sys.modules
    sys.modules['openedx.core.djangoapps.xmodule_django.models'] = sys.modules['opaque_keys.edx.django.models']

    # rg_instructor_analytics_log_collector app could be loaded only after previous mocking
    settings.INSTALLED_APPS += (
        'rg_instructor_analytics_log_collector',
        'rg_instructor_analytics',
        'django.contrib.sites',
        'django.contrib.contenttypes',
        'django.contrib.auth',
    )
    # reset app_configs, the dictionary with the configuration of loaded apps
    apps.app_configs = OrderedDict()
    # set ready to false so that populate will work
    apps.ready = False
    # re-initialize apps
    apps.populate(settings.INSTALLED_APPS)
