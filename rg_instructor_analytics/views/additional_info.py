"""
Additional Info tab API endpoint.
"""
from collections import OrderedDict
import logging

import pycountry
import six
from django.contrib.sites.models import Site
from django.utils.translation import ugettext as _
from rest_framework.decorators import list_route
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from rg_instructor_analytics.models import (
    AgeStats, EducationStats, GenderStats, ResidenceStats,
    GENDER_CHOICES, GENERATION_CHOICES, LEVEL_OF_EDUCATION_CHOICES)
from rg_instructor_analytics.utils import choices_value_by_key
from rg_instructor_analytics.views.tab_fragment import get_available_courses
from rg_instructor_analytics.mock_data import apply_data_mocker, AdditionalInfoGeoDataMocker, \
    AdditionalInfoGenderDataMocker, AdditionalInfoAgeDataMocker, AdditionalInfoEducationDataMocker
from student.models import UserProfile

logger = logging.getLogger(__name__)


class InstructorPermission(BasePermission):
    """
    Django admin or Course Team member.
    """

    def has_permission(self, request, view):
        if request.user.is_staff:
            return True

        if request.data.get('site_id'):
            return request.site.id == request.data.get('site_id')

        user_courses = get_available_courses(request.user)
        if request.data.get('course_id'):
            return request.data.get('course_id') in user_courses

        return bool(user_courses)


class AdditionalInfoViewSet(ViewSet):
    """
    Users demographic stats.
    """

    permission_classes = [IsAuthenticated, InstructorPermission]

    @list_route(methods=['get'], url_name='geo-stats')
    @apply_data_mocker(AdditionalInfoGeoDataMocker)
    def geo(self, request, **kwargs):
        """
        `Country or region of residense` stats endpoint.

        Example:
        {
            total: 1100,
            unknown: 100,
            min: 100,
            max: 600,
            data: [
                { id: "UKR", name: "Ukraine", percent: 60, value: 600 },
                { id: "USA", name: "United States of America", percent: 30, value: 300 },
                { id: "AUS", name: "Australia", percent: 10, value: 100 }
            ]
        }
        """
        site_id = request.GET.get('site_id')
        course_id = request.GET.get('course_id')
        data = self.get_geo_stats(site_id, course_id)
        if not data:
            return Response({})

        total = data.pop('total', 0)
        empty = data.pop('empty', 0)
        percentage_data = self.normalize(data, total - empty)

        geo_stats = {
            'total': total,
            'unknown': empty,
            'min': 100,
            'max': 200,
            'data': []
        }
        if six.PY2:
            alpha2 = 'alpha2'
            alpha3 = 'alpha3'
        else:
            alpha2 = 'alpha_2'
            alpha3 = 'alpha_3'

        for key, value in percentage_data.items():
            # TODO: Revise the possibility of recalculation "percentage_data"
            # taking into account not empty but failed users.
            # Maybe add failed users to the empty
            try:
                country = pycountry.countries.get(**{alpha2: key})
                geo_stats['data'].append({
                    'id': getattr(country, alpha3),
                    'name': _(country.name),
                    'percent': value,
                    'value': data[key],
                })
            except (KeyError, AttributeError):
                # some key alpha2 does not exist in pycountry.countries
                # for example "XK" - Kosovo
                logger.info("Can't get code for country with alpha2 '{}'".format(key))

        return Response(geo_stats)

    @list_route(methods=['get'], url_name='gender-stats')
    @apply_data_mocker(AdditionalInfoGenderDataMocker)
    def gender(self, request, **kwargs):
        """
        `Gender` stats endpoint.

        Example:
        {
            "unknown": 1,
            "total": 3,
            "data": {
                "m": {
                    "abs_value": 0,
                    "value": 0,
                    "label": "male"
                },
                "o": {
                    "abs_value": 0,
                    "value": 0,
                    "label": "other"
                },
                "f": {
                    "abs_value": 2,
                    "value": 100,
                    "label": "female"
                }
            }
        }
        """
        site_id = request.GET.get('site_id')
        course_id = request.GET.get('course_id')
        data = self.get_gender_stats(site_id, course_id)
        if not data:
            return Response({})

        total = data.pop('total', 0)
        empty = data.pop('empty', 0)

        percentage_data = self.normalize(data, total - empty)

        gender_stats = {
            'total': total,
            'unknown': empty,
            'data': {
                gid: {
                    "label": label,
                    "value": percentage_data.get(gid, 0),
                    "abs_value": data.get(gid, 0)
                } for gid, label in GENDER_CHOICES.items()
            },
        }
        return Response(gender_stats)

    @list_route(methods=['get'], url_name='age-stats')
    @apply_data_mocker(AdditionalInfoAgeDataMocker)
    def age(self, request, **kwargs):
        """
        `Year of Birth` stats endpoint.

        Example:
        {
            "total": 160,
            "unknown": 10,
            "data": [
                {
                    "value": 33,
                    "id": "z",
                    "abs_value": 50,
                    "label": "Generation Z: 1995-2012"
                },
                {
                    "value": 47,
                    "id": "m",
                    "abs_value": 70,
                    "label": "Millenials: 1980-1994"
                },
                {
                    "value": 13,
                    "id": "x",
                    "abs_value": 20,
                    "label": "Generation X: 1965-1979"
                },
                {
                    "value": 7,
                    "id": "b",
                    "abs_value": 10,
                    "label": "Baby boomers: 1942-1964"
                }
            ]
        }
        """
        site_id = request.GET.get('site_id')
        course_id = request.GET.get('course_id')
        data = self.get_age_stats(site_id, course_id)
        if not data:
            return Response({})

        total = data.pop('total', 0)
        empty = data.pop('empty', 0)

        clustered_data = self.clusterize_by_generations(data)
        normalized_data = self.normalize(clustered_data, total - empty)
        age_stats = {
            'total': total,
            'unknown': empty,
            'data': [{
                'id': key,
                'label': GENERATION_CHOICES[key],
                'abs_value': clustered_data[key],
                'value': value,
            } for key, value in normalized_data.items()]
        }
        return Response(age_stats)

    @list_route(methods=['get'], url_name='education-stats')
    @apply_data_mocker(AdditionalInfoEducationDataMocker)
    def education(self, request, **kwargs):
        """
        `Level of Education` stats endpoint.

        Example:
        {
            "total": 40,
            "empty": 20,
            "data": [
                {
                    "abs_value": 1,
                    "id": "p",
                    "value": 5,
                    "label": "Academic degree"
                },
                {
                    "abs_value": 0,
                    "id": "m",
                    "value": 0,
                    "label": "Master's degree on specialty"
                },

                ...

                {
                    "abs_value": 3,
                    "id": "b",
                    "value": 15,
                    "label": "Undergraduate"
                }
            ]

        }
        """
        site_id = request.GET.get('site_id')
        course_id = request.GET.get('course_id')
        data = self.get_education_stats(site_id, course_id)
        if not data:
            return Response({})

        total = data.pop('total', 0)
        empty = data.pop('empty', 0)

        normalized_data = self.normalize(data, total - empty)
        edu_stats = {
            'total': total,
            'empty': empty,
            'data': [{
                'id': key,
                'label': LEVEL_OF_EDUCATION_CHOICES.get(
                    key,
                    choices_value_by_key(UserProfile.LEVEL_OF_EDUCATION_CHOICES, key)
                ),
                'value': value,
                'abs_value': data[key],
            } for key, value in normalized_data.items()]
        }
        return Response(edu_stats)

    @list_route(methods=['get'], url_name='scopes')
    def scopes(self, request, **kwargs):
        scopes = OrderedDict({
            'system': _("system"),
            'site': _("microsite"),
            'course': _("course")
        })

        roles = {
            'admin': _("admin"),
            'instructor': _("instructor"),
        }

        user = request.user
        user_courses = [{
            'id': str(course.id),
            'name': str(course.display_name),
        } for course in get_available_courses(user)]

        return Response({
            'scopes': scopes,
            'scope': scopes['system'] if user.is_staff else scopes['course'],
            'roles': roles,
            'role': 'admin' if user.is_staff else 'instructor',
            'sites': list(Site.objects.values('name', 'domain', 'id')),
            'courses': user_courses,
        })

    def get_geo_stats(self, site_id=None, course_id=None):
        """
        Make corresponding scope (Course | Site | system-wide) country of geo stats.
        :param site_id: (int)
        :param course_id: (str)
        :return: (dict)
        """
        if course_id:
            return ResidenceStats.for_course(course_id)

        if site_id:
            return ResidenceStats.for_site(site_id)

        return ResidenceStats.for_date()

    def get_gender_stats(self, site_id=None, course_id=None):
        """
        Make corresponding scope (Course | Site | system-wide) gender stats.
        :param site_id: (int)
        :param course_id: (str)
        :return: (dict)
        """
        if course_id:
            return GenderStats.for_course(course_id)

        if site_id:
            return GenderStats.for_site(site_id)

        return GenderStats.for_date()

    def get_age_stats(self, site_id=None, course_id=None):
        """
        Make corresponding scope (Course | Site | system-wide) year of birth stats.
        :param site_id: (int)
        :param course_id: (str)
        :return: (dict)
        """
        if course_id:
            return AgeStats.for_course(course_id)

        if site_id:
            return AgeStats.for_site(site_id)

        return AgeStats.for_date()

    def get_education_stats(self, site_id=None, course_id=None):
        """
        Make corresponding scope (Course | Site | system-wide) level of education stats.
        :param site_id: (int)
        :param course_id: (str)
        :return: (dict)
        """
        if course_id:
            return EducationStats.for_course(course_id)

        if site_id:
            return EducationStats.for_site(site_id)

        return EducationStats.for_date()

    def normalize(self, data, nonempty_total):
        """
        Compute percentages from absolute values (dividing by total and excluding empty values).

        data: dict
        nonempty_total: int
        return: OrderedDict
        """
        normalized_data = OrderedDict()
        if nonempty_total <= 0:
            return normalized_data

        for key, value in data.items():
            try:
                # Calculate percent of all non-empty values:
                normalized_data[key] = int(round(float(value) / nonempty_total * 100.0))
            except ValueError:
                normalized_data[key] = 0
        return normalized_data

    def clusterize_by_generations(self, data):
        """
        Get number of users by generation, given numbers of users by year of birth
        """
        result = OrderedDict.fromkeys(GENERATION_CHOICES.keys(), 0)
        for key, val in data.items():
            try:
                key = int(key)
            except ValueError:
                continue
            if 1942 <= key <= 1964:
                result['b'] += val
            elif 1965 <= key <= 1979:
                result['x'] += val
            elif 1980 <= key <= 1994:
                result['m'] += val
            elif 1995 <= key <= 2012:
                result['z'] += val
        return result
