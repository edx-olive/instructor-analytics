"""Setup file."""

import os
import re

from setuptools import setup


def get_version(*file_paths):
    """
    Extract the version string from the file at the given relative path fragments.
    """
    filename = os.path.join(os.path.dirname(__file__), *file_paths)
    version_file = open(filename).read()
    version_match = re.search(r"^__version__ = ['\"]([^'\"]*)['\"]", version_file, re.M)
    if version_match:
        return version_match.group(1)
    raise RuntimeError('Unable to find version string.')


VERSION = get_version('rg_instructor_analytics', '__init__.py')

with open(os.path.join(os.path.dirname(__file__), 'README.md')) as readme:
    README = readme.read()

with open(os.path.join(os.path.dirname(__file__), 'CHANGELOG.rst')) as changelog:
    CHANGELOG = changelog.read()

setup(
    name="instructor-analytics",
    version=VERSION,
    install_requires=[
        "setuptools",
    ],
    requires=[],
    packages=["rg_instructor_analytics"],
    include_package_data=True,
    description='Open Edx Instructor analytics tab',
    long_description=README + '\n\n' + CHANGELOG,
    entry_points={
        "lms.djangoapp": [
            "rg_instructor_analytics = rg_instructor_analytics.apps:RgInstructorAnalyticsAppConfig",
        ],
        "openedx.course_tab": [
            "instructor_analytics = rg_instructor_analytics.plugins:InstructorAnalyticsDashboardTab"
        ],
    }
)
