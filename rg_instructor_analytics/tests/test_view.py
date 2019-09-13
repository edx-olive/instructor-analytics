"""
Test for view.
"""
import json
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.http.request import QueryDict
from django.test import RequestFactory, TestCase
from mock import Mock, patch
from opaque_keys import InvalidKeyError

from rg_instructor_analytics.views.enrollment import EnrollmentStatisticView
from rg_instructor_analytics.views.insights import InsightsStatisticView
from rg_instructor_analytics_log_collector.models import EnrollmentByDay


class TestEnrollmentStatisticView(TestCase):
    """
    Test for enrollment statistic view.
    """

    MOCK_PREVIOUS_ENROLL_STATE = (4, -1)
    MOCK_CURRENT_ENROLL_STATE = [
        {'date': date(2017, 10, 6), 'count': 1, 'is_active': False},
        {'date': date(2017, 10, 7), 'count': 1, 'is_active': False},
        {'date': date(2017, 10, 8), 'count': 2, 'is_active': False},
        {'date': date(2017, 10, 8), 'count': 1, 'is_active': True},
        {'date': date(2017, 10, 14), 'count': 1, 'is_active': True},
        {'date': date(2017, 10, 20), 'count': 1, 'is_active': True},
        {'date': date(2017, 10, 23), 'count': 1, 'is_active': True},
    ]
    MOCK_FROM_DATE = 1507150800
    MOCK_TO_DATE = 1509573600
    MOCK_REQUEST_PARAMS = QueryDict('from=' + str(MOCK_FROM_DATE) + '&to=' + str(MOCK_TO_DATE))
    MOCK_COURSE_ID = 'course-v1:test+course+id'
    MOCK_ALLOWED_USER = 'staff'
    MOCK_UN_ALLOWED_USER = 'honor'

    EXPECTED_ENROLL_STATISTIC = {
        'dates': [1507150800, 1507262400, 1507348800, 1507435200, 1507953600, 1508472000, 1508731200, 1509573600],
        'total': [3, 2, 1, 0, 1, 2, 3, 3],
        'enroll': [4, 4, 4, 5, 6, 7, 8, 8],
        'unenroll': [-1, -2, -3, -5, -5, -5, -5, -5],
    }

    def setUp(self):
        """
        Implement from base class.
        """
        self.factory = RequestFactory()

        self.request = self.factory.post(
            '/courses/{}/tab/instructor_analytics/api/enroll_statics/'.format(self.MOCK_COURSE_ID)
        )
        self.request.user = self.MOCK_ALLOWED_USER
        self.request.POST = self.MOCK_REQUEST_PARAMS

    @patch('rg_instructor_analytics.views.has_access')
    @patch('rg_instructor_analytics.views.get_course_by_id')
    @patch('rg_instructor_analytics.views.CourseKey.from_string')
    @patch('rg_instructor_analytics.views.EnrollmentStatisticView.get_daily_stats_for_course')
    def test_enroll_statistic_post_call(
        self,
        moc_get_statistic_per_day,
        moc_course_key_from_string,
        moc_get_course_by_id,
        moc_has_access
    ):
        """
        Verify standard post flow.
        """
        moc_get_statistic_per_day.return_value = self.EXPECTED_ENROLL_STATISTIC
        moc_course_key_from_string.return_value = 'key'
        moc_get_course_by_id.return_value = 'course'
        moc_has_access.return_value = True

        response = EnrollmentStatisticView.as_view()(self.request, course_id=self.MOCK_COURSE_ID)

        self.assertEqual(response.status_code, 200)
        moc_course_key_from_string.assert_called_once_with(self.MOCK_COURSE_ID)
        moc_has_access.assert_called_once_with(self.MOCK_ALLOWED_USER, 'staff', moc_get_course_by_id.return_value)

    @patch('rg_instructor_analytics.views.log.error')
    @patch('rg_instructor_analytics.views.CourseKey.from_string')
    def test_enroll_statistic_post_call_with_fake_course(
        self,
        moc_course_key_from_string,
        moc_log_error,
    ):
        """
        Verify reaction to the invalid course.
        """
        moc_course_key_from_string.return_value = 'key'
        moc_course_key_from_string.side_effect = Mock(side_effect=InvalidKeyError('', ''))

        response = EnrollmentStatisticView.as_view()(self.request, course_id=self.MOCK_COURSE_ID)

        self.assertEqual(response.status_code, 400)
        moc_log_error.assert_called_once_with(
            "Unable to find course with course key %s while getting enrollment statistic",
            self.MOCK_COURSE_ID
        )

    @patch('rg_instructor_analytics.views.log.error')
    @patch('rg_instructor_analytics.views.has_access')
    @patch('rg_instructor_analytics.views.get_course_by_id')
    @patch('rg_instructor_analytics.views.CourseKey.from_string')
    def test_enroll_statistic_post_call_with_unallowed_user(
        self,
        moc_course_key_from_string,
        moc_get_course_by_id,
        moc_has_access,
        moc_log_error
    ):
        """
        Verify reaction to user, which do not have access to  the given API.
        """
        moc_course_key_from_string.return_value = 'key'
        moc_get_course_by_id.return_value = 'course'
        moc_has_access.return_value = False

        self.request.user = self.MOCK_UN_ALLOWED_USER
        response = EnrollmentStatisticView.as_view()(self.request, course_id=self.MOCK_COURSE_ID)

        moc_log_error.assert_called_once_with(
            "Enrollment statistics not available for user type `%s`",
            self.request.user
        )
        self.assertEqual(response.status_code, 403)

    @patch('rg_instructor_analytics.views.EnrollmentStatisticView.get_last_state')
    @patch('rg_instructor_analytics.views.EnrollmentStatisticView.get_state_for_period')
    def test_get_statistic_per_day(self, mock_get_state_in_period, moc_get_state_before):
        """
        Verify collection of statistic per day.
        """
        moc_get_state_before.return_value = self.MOCK_PREVIOUS_ENROLL_STATE
        mock_get_state_in_period.return_value = self.MOCK_CURRENT_ENROLL_STATE
        stats = EnrollmentStatisticView.get_daily_stats_for_course(self.MOCK_FROM_DATE, self.MOCK_TO_DATE, 'key')

        self.assertEqual(stats, self.EXPECTED_ENROLL_STATISTIC)

    @patch('rg_instructor_analytics.views.EnrollmentStatisticView.request_to_db_for_stats_before')
    def test_get_state_before(self, mock_request_to_db_for_stats_before):
        """
        Verify getting statistics of the enrolled/unenrolled users before given day.
        """
        mock_request_to_db_for_stats_before.return_value = [
            {'is_active': True, 'count': 10},
            {'is_active': False, 'count': 2},
        ]
        expect = (10, -2)
        stats = EnrollmentStatisticView.get_last_state('key', '12345')
        self.assertEqual(stats, expect)

        mock_request_to_db_for_stats_before.return_value = [
            {'is_active': False, 'count': 2},
        ]
        expect = (0, -2)
        stats = EnrollmentStatisticView.get_last_state('key', '12345')
        self.assertEqual(stats, expect)

        mock_request_to_db_for_stats_before.return_value = [
            {'is_active': True, 'count': 10},
        ]
        expect = (10, 0)
        stats = EnrollmentStatisticView.get_last_state('key', '12345')
        self.assertEqual(stats, expect)


class TestGeneralMetricsTestView(TestCase):
    """
    Test for General Metrics View.
    """
    MOCK_COURSE_ID = 'course-v1:edX+DemoX+Demo_Course'
    MOCK_COURSE_ID_2 = 'course-v1:edX+DemoX+Demo_Course1'

    def setUp(self):
        """
        Implement from base class.
        """
        self.factory = RequestFactory()

        self.request = self.factory.post(
            '/courses/{}/tab/instructor_analytics/api/enroll_statics/'.format(self.MOCK_COURSE_ID)
        )
        self.request.GET = {'page': 1}
        self.request.user = User.objects.create(username='staff', email='staff@example.com', is_staff=True)

    def test_instructor_access(self):
        """
        Tests that user with staff access gets right status code and response.
        """

        response = InsightsStatisticView.as_view()(self.request)

        self.assertEqual(response.status_code, 200)

    def test_student_without_access(self):
        """
        Tests that student hasn't access to endpoint.
        """

        student = User.objects.create(username='student', email='student@test.com')
        self.request.user = student

        response = InsightsStatisticView.as_view()(self.request)

        self.assertEqual(response.status_code, 403)

    def test_pagination_data(self):
        """
        Tests that response includes data for pagination.
        """

        response = InsightsStatisticView.as_view()(self.request)

        content = json.loads(response.content)

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(content.get('count_pages'))
        self.assertIsNotNone(content.get('current_page'))

        self.assertEqual(content.get('current_page'), 1)
        self.assertEqual(content.get('count_pages'), 1)

    def test_response_has_general_metrics(self):
        """
        Tests that response includes total metrics.
        """

        response = InsightsStatisticView.as_view()(self.request)

        content = json.loads(response.content)

        self.assertEqual(response.status_code, 200)

        self.assertIsInstance(content, dict)

        self.assertIsNotNone(content.get('total_metrics'))

        expected_total_metrics = {
            "total_enrolled": 0,
            "total_current_enrolled": 0,
            "total_diff_enrolled": 0,
            "certificates": 0,
        }

        self.assertEqual(json.loads(content.get('total_metrics')), expected_total_metrics)

    def test_getting_total_metrics(self):
        """
        Tests that helper method return data as excepted.
        """

        EnrollmentByDay.objects.create(
            day=date.today(),
            total=4,
            enrolled=2,
            unenrolled=1,
            course=self.MOCK_COURSE_ID
        )

        expected_result = {
            "total_enrolled": 4,
            "total_current_enrolled": 2,
            "total_diff_enrolled": 0,
            "certificates": 0,
        }

        response_total_metrics = InsightsStatisticView.get_total_metrics()

        self.assertEqual(response_total_metrics, expected_result)

    def test_output_metrics(self):
        """
        Tests that endpoint return metrics as excepted.
        """

        today_date = date.today()

        EnrollmentByDay.objects.bulk_create([
            EnrollmentByDay(day=today_date, total=4, enrolled=2, unenrolled=1, course=self.MOCK_COURSE_ID),
            EnrollmentByDay(day=today_date, total=12, enrolled=12, unenrolled=0, course=self.MOCK_COURSE_ID_2),
            EnrollmentByDay(
                day=today_date - timedelta(days=1), total=12, enrolled=12, unenrolled=0, course=self.MOCK_COURSE_ID_2
            )
        ])

        response = InsightsStatisticView.as_view()(self.request)

        content = json.loads(response.content)

        course_keys = [
            u"name",
            u"course_url",
            u"total",
            u"enrolled_max",
            u"week_change",
            u"start_date",
            u"end_date",
            u"certificates",
            u"count_graded"
        ]

        courses = json.loads(content.get("courses"))

        expected_courses_list = [
            {
                u'name': u'course-v1:edX+DemoX+Demo_Course',
                u'end_date': u'-',
                u'week_change': 0,
                u'course_url': u'/courses/course-v1:edX+DemoX+Demo_Course/course/',
                u'enrolled_max': 2,
                u'certificates': 0,
                u'total': 4,
                u'start_date': u'-',
                u'count_graded': 0
            },
            {
                u'name': u'course-v1:edX+DemoX+Demo_Course1',
                u'end_date': u'-',
                u'week_change': 0,
                u'course_url': u'/courses/course-v1:edX+DemoX+Demo_Course1/course/',
                u'enrolled_max': 12,
                u'certificates': 0,
                u'total': 12,
                u'start_date': u'-',
                u'count_graded': 0
            }
        ]

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(courses), 2)
        self.assertEqual(sorted(courses[0].keys()), sorted(course_keys))
        self.assertEqual(courses, expected_courses_list)
