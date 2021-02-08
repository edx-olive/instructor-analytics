from collections import OrderedDict
import sys

from django.apps import apps
from django.conf import settings

from mock import MagicMock
import pytest


@pytest.fixture(scope="session", autouse=True)
def mock_non_installed_edx_packages(request):
    """Break out dependencies from edx-platform"""

    # For CourseKeyField class
    # openedx.core.djangoapps.xmodule_django.models.CourseKeyField
    # is wrapper around opaque_keys.edx.django.models.CourseKeyField with deprecation warning
    # TODO: rewrite rg_instructor_analytics_log_collector with CourseKeyField from opaque_keys and remove next mocking
    sys.modules['openedx'] = MagicMock()
    sys.modules['openedx.core'] = MagicMock()
    sys.modules['openedx.core.djangoapps'] = MagicMock()
    sys.modules['openedx.core.djangoapps.xmodule_django'] = MagicMock()
    sys.modules['openedx.core.djangoapps.content'] = MagicMock()
    sys.modules['openedx.core.djangoapps.content.course_overviews'] = MagicMock()
    sys.modules['openedx.core.djangoapps.content.course_overviews.models'] = MagicMock()
    import opaque_keys.edx.django.models  # to get from sys.modules
    sys.modules['openedx.core.djangoapps.xmodule_django.models'] = sys.modules['opaque_keys.edx.django.models']

    # imports from courseware should be patched at tests
    sys.modules['courseware'] = MagicMock()
    sys.modules['courseware.access'] = MagicMock()
    sys.modules['courseware.courses'] = MagicMock()

    sys.modules['student'] = MagicMock()
    sys.modules['student.models'] = MagicMock()

    sys.modules['instructor'] = MagicMock()
    sys.modules['instructor.views'] = MagicMock()
    sys.modules['instructor.views.api'] = MagicMock()

    sys.modules['util'] = MagicMock()
    sys.modules['util.views'] = MagicMock()

    # rg_instructor_analytics_log_collector app could be loaded only after previous mocking
    settings.INSTALLED_APPS += (
        'rg_instructor_analytics_log_collector',
        'rg_instructor_analytics',
        'django.contrib.sites',
        'django.contrib.contenttypes',
        'django.contrib.auth'
    )
    # reset app_configs, the dictionary with the configuration of loaded apps
    apps.app_configs = OrderedDict()
    # set ready to false so that populate will work
    apps.ready = False
    # re-initialize apps
    apps.populate(settings.INSTALLED_APPS)
