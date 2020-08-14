"""
Additional Info tab API endpoint.
"""
from collections import OrderedDict
import pycountry

from django.utils.translation import ugettext as _
from rest_framework.decorators import list_route
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from student.models import UserProfile
from rg_instructor_analytics.models import AgeStats, EducationStats, GenderStats, ResidenceStats


GENERATION_CHOICES = OrderedDict((
    ('z', _("Generation Z: 1995-2012")),
    ('m', _("Millenials: 1980-1994")),
    ('x', _("Generation X: 1965-1979")),
    ('b', _("Baby boomers: 1942-1964")),
))

LEVEL_OF_EDUCATION_CHOICES = {
    'p': _("Academic degree"),
    'm': _("Master's degree on specialty"),
    'b': _("Undergraduate"),
    'a': _("Incomplete higher education"),
    'hs': _("The average"),
    'jhs': _("Incomplete secondary"),
    'el': _("Initial"),
    'none': _("No formal education"),
    'other': _("Other education"),
}

GENDER_CHOICES = {
    'm': _("Male"),
    'o': _("Other"),
    'f': _("Female"),
}


class AdditionalInfoViewSet(ViewSet):
    """
    Users demographic stats.
    """

    # TODO: add permission check: [Instructor | Superuser]

    @list_route(methods=['post'], url_name='overall-stats')
    def overall(self, request, course_id):
        site_id = request.data.get('site_id')
        course_id = request.data.get('course_id')
        return Response({
            'residence': self.get_residence_stats(site_id, course_id),
            'gender': self.get_gender_stats(site_id, course_id),
            'age': self.get_age_stats(site_id, course_id),
            'education': self.get_education_stats(site_id, course_id),
        })

    @list_route(methods=['post'], url_name='residence-stats')
    def residence(self, request, **kwargs):
        site_id = request.data.get('site_id')
        course_id = request.data.get('course_id')
        data = self.get_residence_stats(site_id, course_id)
        normalized_data = self.normalize(data)
        data_array = [{
            'id': pycountry.countries.get(alpha2=key).alpha3,
            'value': val,
            'abs_value': data[key],
            'total': data['total'],
            'empty': data['empty']
        } for key, val in normalized_data.items()]
        return Response(data_array)

    @list_route(methods=['post'], url_name='gender-stats')
    def gender(self, request, **kwargs):
        site_id = request.data.get('site_id')
        course_id = request.data.get('course_id')
        data = self.get_gender_stats(site_id, course_id)
        normalized_data = self.normalize(data)
        for key, val in OrderedDict(GENDER_CHOICES).items():
            normalized_data[val] = normalized_data.pop(key)

        normalized_data['id'] = 'gender'
        normalized_data.update(data)
        data_array = [
            normalized_data
        ]
        return Response(data_array)

    @list_route(methods=['post'], url_name='age-stats')
    def age(self, request, **kwargs):
        site_id = request.data.get('site_id')
        course_id = request.data.get('course_id')
        data = self.get_age_stats(site_id, course_id)
        data = self.custerize_by_generations(data)
        normalized_data = self.normalize(data)
        data_array = [{
            'id': key,
            'label': GENERATION_CHOICES[key],
            'value': val,
            'abs_value': data[key],
            'total': data['total'],
            'empty': data['empty']
        } for key, val in normalized_data.items()]
        return Response(data_array)

    @list_route(methods=['post'], url_name='education-stats')
    def education(self, request, **kwargs):
        site_id = request.data.get('site_id')
        course_id = request.data.get('course_id')
        data = self.get_education_stats(site_id, course_id)
        normalized_data = self.normalize(data)
        data_array = [{
            'id': key,
            'label': LEVEL_OF_EDUCATION_CHOICES.get(key),
            'value': val,
            'abs_value': data[key],
            'total': data['total'],
            'empty': data['empty']
        } for key, val in normalized_data.items()]
        return Response(data_array)

    def get_residence_stats(self, site_id=None, course_id=None):
        """
        Make corresponding scope (Course | Site | system-wide) country of residence stats.
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

    def normalize(self, data):
        """
        Compute percentages from absolute values (dividing by total and excluding empty values).

        data: dict
        return: dict
        """
        normalized_data = OrderedDict()
        nonempty_total = data['total'] - data['empty']
        if nonempty_total <= 0:
            return {}
        for key, val in data.items():
            if key in ['total', 'empty']:
                continue
            normalized_data[key] = int(round(float(val)/nonempty_total * 100))
        return normalized_data

    def custerize_by_generations(self, data):
        """
        Get number of users by generation, given numbers of users by year of birth
        """
        out_data = OrderedDict.fromkeys(GENERATION_CHOICES.keys(), 0)
        out_data['total'] = data.get('total', 0)
        out_data['empty'] = data.get('empty', 0)
        for key, val in data.items():
            try:
                key = int(key)
            except ValueError:
                continue
            if 1942 <= key <= 1964:
                out_data['b'] += val
            elif 1965 <= key <= 1979:
                out_data['x'] += val
            elif 1980 <= key <= 1994:
                out_data['m'] += val
            elif 1995 <= key <= 2012:
                out_data['z'] += val
        return out_data
