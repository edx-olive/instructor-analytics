"""
Tests for enrollment view.
"""
import calendar
import json
from datetime import datetime

from django.test import RequestFactory
from django_mock_queries.query import MockSet, MockModel
import pytest
from .utils import load_params_from_json


def _date_sting_to_timestamp(date_string):
    d = datetime.strptime(date_string, '%d-%m-%Y')
    return calendar.timegm(d.timetuple())


def _date_timestamp_to_human_readable_string(date_timestamp):
    d = datetime.utcfromtimestamp(date_timestamp).date()
    return d.strftime('%d-%m-%Y')


def _setup_mock_db_data(mocker, course_key, data):
    enrolls = MockSet()
    mocker.patch('rg_instructor_analytics.views.enrollment.EnrollmentByDay.objects', enrolls)
    mock_models = []
    for day_data in data:
        day = datetime.strptime(day_data.pop('day'), '%d-%m-%Y').date()
        mock_models.append(MockModel(course=course_key, day=day, **day_data))

    enrolls.add(*mock_models)


def _check_response_data(response_data, expected_data, course_key):
    """
    Split response checking by parts to simplify mismatch detection if test fails
    """
    expected_sections = set(('enrolls', 'unenrolls', 'totals'))

    for section in expected_sections:
        for i in range(len(response_data[section])):
            data_line = response_data[section][i]
            data_line[0] = _date_timestamp_to_human_readable_string(data_line[0]/1000)
            assert data_line == expected_data[section][i], "{}, {}".format(course_key, section)

        # check there is no missed expected points
        assert len(response_data[section]) == len(expected_data[section]), "{}, {} length".format(course_key, section)

    # check there is no expected top-level keys in response
    assert set(response_data.keys()) == expected_sections


@pytest.mark.parametrize(
    "entry",
    # various data sets to check zero data completion for correct graphics displaying works as expected
    load_params_from_json('rg_instructor_analytics/tests/resources/enrollment_dataset.json'),
)
def test_enroll_statistic_post_call(entry, mocker):
    """
    Verify standard post flow.
    """
    from rg_instructor_analytics.views.enrollment import EnrollmentStatisticView

    course_key = entry['course_key']
    _setup_mock_db_data(mocker, course_key, entry.get('stored_data', []))
    mocker.patch('rg_instructor_analytics.utils.decorators.has_access', return_value=True)
    mocker.patch('rg_instructor_analytics.views.enrollment.CourseKey.from_string', return_value=course_key)

    from_date = _date_sting_to_timestamp(entry['from_date'])
    to_date = _date_sting_to_timestamp(entry['to_date'])

    request_data = {'from': from_date, 'to': to_date, 'course_id': course_key}
    request = RequestFactory().post(
        '/courses/{}/tab/instructor_analytics/api/enroll_statics/'.format(course_key), request_data
    )
    request.user = 'staff'

    response = EnrollmentStatisticView.as_view()(request, course_id=course_key)

    assert response.status_code == 200
    _check_response_data(json.loads(response.content), entry['expected_output'], course_key)


def test_enroll_statistic_post_call_with_unallowed_user(mocker):
    """
    Verify standard post flow.
    """
    from rg_instructor_analytics.views.enrollment import EnrollmentStatisticView

    mocker.patch('rg_instructor_analytics.utils.decorators.has_access', return_value=False)

    request_data = {
        'from': _date_sting_to_timestamp('01-01-2018'),
        'to': _date_sting_to_timestamp('02-01-2018'),
        'course_id': 'course_id'
    }
    request = RequestFactory().post(
        '/courses/{}/tab/instructor_analytics/api/enroll_statics/'.format('course_id'), request_data
    )
    request.user = 'not_staff'

    response = EnrollmentStatisticView.as_view()(request, course_id='course_id')
    assert response.status_code == 400
