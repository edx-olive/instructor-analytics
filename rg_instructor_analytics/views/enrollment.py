"""
Enrollment stats sub-tab module.
"""
import calendar
from collections import deque
from datetime import datetime, timedelta

from django.conf import settings
from django.http import HttpResponseBadRequest, JsonResponse
from django.utils.datastructures import MultiValueDictKeyError
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.views.generic import View
from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey
from rg_instructor_analytics_log_collector.models import EnrollmentByDay

from rg_instructor_analytics.utils.decorators import instructor_access_required
from rg_instructor_analytics.mock_data import apply_data_mocker, EnrollmentsDataMocker

JS_URL = '{static_url}rg_instructor_analytics/js/'.format(static_url=settings.STATIC_URL)
CSS_URL = '{static_url}rg_instructor_analytics/css/'.format(static_url=settings.STATIC_URL)

QUESTUIN_SELECT_TYPE = 'select'
QUESTUIN_MULTI_SELECT_TYPE = 'multySelect'


class EnrollmentStatisticView(View):
    """
    Enrollment stats API view.

    Data source: EnrollmentByDay DB model (rg_analytics_collector).
    """

    @method_decorator(instructor_access_required)
    def dispatch(self, *args, **kwargs):
        """
        See: https://docs.djangoproject.com/en/1.8/topics/class-based-views/intro/#id2.
        """
        return super(EnrollmentStatisticView, self).dispatch(*args, **kwargs)

    @staticmethod
    @apply_data_mocker(EnrollmentsDataMocker)
    def get_daily_stats_for_course(from_timestamp, to_timestamp, course_key):  # get_day_course_stats
        """
        Provide statistic, which contains: dates in unix-time, count of enrolled users, unenrolled and total.

        Return map with next keys:
         enrolls - store list of pairs - dates in unix-time, count of enrolled user for given day;
         unenrolls - store list of pairs - dates in unix-time, count of unenrolled user for given day;
         total - store list of pairs - dates in unix-time, count of active users.
        """
        from_date = datetime.utcfromtimestamp(from_timestamp).date()
        to_date = datetime.utcfromtimestamp(to_timestamp).date()

        enroll_list = []
        unenroll_list = []
        total_list = []
        prev_enroll_day = from_date - timedelta(days=1)  # to start completion with from_date
        prev_unenroll_day = from_date - timedelta(days=1)
        prev_total_day = from_date

        format_day = lambda fday: calendar.timegm(fday.timetuple()) * 1000

        def get_prev_total_value():
            qs = EnrollmentByDay.objects.filter(
                course=course_key, day__lt=from_date
            ).values_list('total', flat=True).order_by('-day').first()
            return qs if qs else 0

        def check_and_complete(day, prev_day, value, values_list):
            if value:
                days_delta = (day - prev_day).days
                if days_delta > 1:
                    # at least one empty day between values - fill with zero day after previous value
                    values_list.append((format_day(prev_day + timedelta(days=1)), 0))
                    if days_delta > 2:
                        # at least two days between values - fill with zero day before current value
                        values_list.append((format_day(day - timedelta(days=1)), 0))
                values_list.append((format_day(day), value))
                return day
            return prev_day  # not changed if value is 0

        def check_and_complete_end(end_day, prev_day, values_list):
            if end_day != prev_day:
                if (end_day - prev_day).days > 1:
                    values_list.append((format_day(prev_day + timedelta(days=1)), 0))
                values_list.append((format_day(end_day), 0))

        raw_data = deque(EnrollmentByDay.objects.filter(
            course=course_key, day__range=(from_date, to_date)
        ).values_list('day', 'enrolled', 'unenrolled', 'total').order_by('day'))

        # start chart at from_date even if there is no it's data in query
        # also guarantied that there is at least one list item
        if not raw_data or raw_data[0][0] != from_date:
            raw_data.appendleft([from_date, 0, 0, get_prev_total_value()])

        elif raw_data[0][3] == 0:  # try to get value for start point of 'total' if it is zero
            raw_data[0][3] = get_prev_total_value()

        for day, enrolled, unenrolled, total in raw_data:
            prev_enroll_day = check_and_complete(day, prev_enroll_day, enrolled, enroll_list)
            prev_unenroll_day = check_and_complete(day, prev_unenroll_day, unenrolled, unenroll_list)

            days_delta = (day - prev_total_day).days
            if days_delta > 1:
                total_list.append((format_day(day - timedelta(days=1)), total_list[-1][1]))
            total_list.append((format_day(day), total))
            prev_total_day = day

        # complete end points
        check_and_complete_end(to_date, prev_enroll_day, enroll_list)
        check_and_complete_end(to_date, prev_unenroll_day, unenroll_list)
        if prev_total_day and prev_total_day != to_date:
            total_list.append((format_day(to_date), total_list[-1][1]))

        return {
            'enrolls': enroll_list, 'unenrolls': unenroll_list, 'totals': total_list
        }

    def post(self, request, course_id):
        """
        POST request handler.

        :param course_id: (str) context course ID (from urlconf)
        """
        try:
            from_timestamp = int(request.POST['from'])
            to_timestamp = int(request.POST['to'])

            stats_course_id = request.POST['course_id']
            course_key = CourseKey.from_string(stats_course_id)

        except MultiValueDictKeyError:
            return HttpResponseBadRequest(_("`from`, `to`, `course_id` are the must."))
        except TypeError:
            return HttpResponseBadRequest(_("Invalid date range."))
        except InvalidKeyError:
            return HttpResponseBadRequest(_("Invalid course ID."))

        return JsonResponse(
            data=self.get_daily_stats_for_course(from_timestamp, to_timestamp, course_key)
        )
