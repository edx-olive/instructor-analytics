"""
Gradebook sub-tab module.
"""
import calendar
from datetime import datetime, timedelta

from django.db.models import Count, Sum
from django.http import HttpResponseBadRequest, JsonResponse
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.views.generic import View
from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey
from rg_instructor_analytics_log_collector.models import (
    CourseVisitsByDay, DiscussionActivityByDay, StudentStepCourse, VideoViewsByDay
)

from lms.djangoapps.courseware.courses import get_course_by_id
from rg_instructor_analytics.utils.decorators import instructor_access_required
from rg_instructor_analytics.mock_data import apply_data_mocker, ActivitiesDailyDataMocker, UnitVisitsDataMocker


class ActivityView(View):
    """
    Activities API view.
    """

    @method_decorator(instructor_access_required)
    def dispatch(self, *args, **kwargs):
        """
        See: https://docs.djangoproject.com/en/1.8/topics/class-based-views/intro/#id2.
        """
        return super(ActivityView, self).dispatch(*args, **kwargs)

    @apply_data_mocker(ActivitiesDailyDataMocker)
    def get_daily_activity_for_course(self, from_date, to_date, course_key):
        """
        Get statistic of video and discussion activities by days.
        """
        def no_group_qs(model_class):
            return model_class.objects.filter(
                course=course_key, day__range=(from_date, to_date)
            ).order_by('day').values_list('day', 'total')

        # VideoViewsByDay is unique not for ('course', 'day'), but for ('course', 'day', 'video_block_id')
        # so it's grouped by day and summed in query
        video_views_qs = VideoViewsByDay.objects \
            .filter(course=course_key, day__range=(from_date, to_date)) \
            .order_by('day') \
            .values_list('day') \
            .annotate(total=Sum('total'))

        format_day = lambda fday: calendar.timegm(fday.timetuple()) * 1000

        def complete_data(qs):
            out_list = []
            prev_day = from_date - timedelta(days=1)
            for day, total in qs:
                days_delta = (day - prev_day).days
                if days_delta > 1:
                    # at least one empty day between values - fill with zero day after previous value
                    out_list.append((format_day(prev_day + timedelta(days=1)), 0))
                    if days_delta > 2:
                        # at least two day between values - fill with zero day before current value
                        out_list.append((format_day(day - timedelta(days=1)), 0))

                out_list.append((format_day(day), total))
                prev_day = day

            if to_date != prev_day:
                if (to_date - prev_day).days > 1:
                    out_list.append((format_day(prev_day + timedelta(days=1)), 0))
                out_list.append((format_day(to_date), 0))

            return out_list

        return {
            'video_views': complete_data(video_views_qs),
            'discussion_activities': complete_data(no_group_qs(DiscussionActivityByDay)),
            'course_activities': complete_data(no_group_qs(CourseVisitsByDay))
        }

    @apply_data_mocker(UnitVisitsDataMocker)
    def get_unit_visits(self, from_date, to_date, course_key):
        """
        Get statistic of visiting units.
        """
        course = get_course_by_id(course_key, depth=3)

        ticktext = []
        tickvals = []
        count_visits = []

        def _make_query(field_name):
            """
            Create aggregated query and return it's result

            Query format is:
                SELECT <field_name>, COUNT(<field_name>) AS <field_name>__count
                FROM rg_instructor_analytics_log_collector_studentstepcourse
                WHERE (course = '<course_key>' AND log_time BETWEEN '<start_date>' AND '<end_date>')
                GROUP BY <field_name>

            :param field_name: field that contain unit id, could be 'current_unit' or 'target_unit'
            :return: dict, {<unit_id>: <count>}
            """
            qs = StudentStepCourse.objects.filter(
                course=course_key,
                log_time__range=(from_date, to_date + timedelta(days=1))
            )
            qs = qs.values(field_name).annotate(Count(field_name))
            return dict(qs.values_list(field_name, '{}__count'.format(field_name)))

        # 'current_unit' mean user leave unit, 'target_unit' mean user come to unit
        counted_current_units = _make_query('current_unit')
        counted_target_units = _make_query('target_unit')

        for section in course.get_children():
            for subsection in section.get_children():
                for unit in subsection.get_children():
                    tickvals.append(unit.location.block_id)
                    ticktext.append(unit.display_name)
                    # we could have some missed events like 'Start Course' click or go to subsection from Course Outline
                    # so why we select highest value from current_unit and target_unit counts
                    count_visits.append(
                        max(
                            counted_current_units.get(unit.location.block_id, 0),
                            counted_target_units.get(unit.location.block_id, 0)
                        )
                    )

        return {
            'ticktext': ticktext,
            'tickvals': tickvals,
            'count_visits': count_visits
        }

    def post(self, request, course_id, slug):
        """
        POST request handler.

        :param course_id: (str) context course ID (from urlconf)
        """
        try:
            from_timestamp = int(request.POST.get('from'))
            to_timestamp = int(request.POST.get('to'))
            course_key = CourseKey.from_string(request.POST.get('course_id'))

        except (TypeError, ValueError):
            return HttpResponseBadRequest(_("Invalid date range."))
        except InvalidKeyError:
            return HttpResponseBadRequest(_("Invalid course ID."))

        from_date = datetime.utcfromtimestamp(from_timestamp).date()
        to_date = datetime.utcfromtimestamp(to_timestamp).date()

        if slug == 'daily':
            activity = self.get_daily_activity_for_course(from_date, to_date, course_key)
        elif slug == 'unit_visits':
            activity = self.get_unit_visits(from_date, to_date, course_key)
        else:
            activity = {}

        return JsonResponse(data=activity)
