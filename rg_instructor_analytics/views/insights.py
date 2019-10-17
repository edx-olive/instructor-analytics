"""
General metrics stats sub-tab module.
"""

import json
from datetime import datetime, timedelta

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Max, Min, Q
from django.http import HttpResponseBadRequest, JsonResponse
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.views.decorators.cache import cache_control
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.views.generic import View
from opaque_keys.edx.django.models import CourseKeyField
from opaque_keys.edx.keys import CourseKey

from lms.djangoapps.certificates.models import GeneratedCertificate
from lms.djangoapps.instructor.views.api import common_exceptions_400, require_level
from lms.djangoapps.instructor.views.instructor_task_helpers import extract_task_features
from lms.djangoapps.instructor_task.api import (
    get_running_instructor_tasks,
    submit_general_enrollment_features_csv,
    submit_general_grade_csv_report,
    submit_users_features_csv,
)
from lms.djangoapps.instructor_task.models import ReportStore
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from rg_instructor_analytics.utils.mixins import InstructorRequiredMixin
from rg_instructor_analytics_log_collector.models import EnrollmentByDay

COUNT_PER_PAGE = getattr(settings, 'ANALYTICS_GENERAL_COUNT_PER_PAGE', 50)


class InsightsStatisticView(InstructorRequiredMixin, View):
    """
    General stats API view.

    Data source: EnrollmentByDay DB model (rg_analytics_collector).
    """

    @staticmethod
    def get_total_metrics():
        """
        Method that returns total metrics across all courses.

        :return: (dict) total metrics.
        example output: {
            "total_enrolled": 20,
            "total_current_enrolled": 18,
            "total_diff_enrolled": 3,
            "certificates": 4,
        }
        """

        total_metrics = {
            "total_enrolled": 0,
            "total_current_enrolled": 0,
            "total_diff_enrolled": 0,
            "certificates": GeneratedCertificate.objects.count(),
        }

        total_metrics_query = (
            EnrollmentByDay.objects.order_by("course")
                .values('course')
                .annotate(
                total=Max('total'),
                enrolled_max=Max('enrolled'),
                diff_enr_max=Max('enrolled', filter=Q(day__gt=datetime.now() - timedelta(weeks=1))),
                diff_enr_min=Min('enrolled', filter=Q(day__gt=datetime.now() - timedelta(weeks=1))),
            )
        )

        for course in total_metrics_query:
            total_metrics["total_enrolled"] += course["total"]
            total_metrics["total_current_enrolled"] += course['enrolled_max']
            total_metrics["total_diff_enrolled"] += course['diff_enr_max'] - course['diff_enr_min']

        return total_metrics

    @staticmethod
    def get_microsite_filter(microsites, ms_selected):
        """
        Helper method that returns course_org_filter for selected microsite.

        :return: string or tuple with course_org_filter value(s) for filtering
                 or None if SiteConfiguration does not exist.
        """

        try:
            m_site = microsites.get(site__name=ms_selected)
            course_org_filter = m_site.values.get('course_org_filter')

            if course_org_filter is not None:
                if isinstance(course_org_filter, list):
                    course_org_filter = tuple(str(course_filter) for course_filter in course_org_filter)

                return course_org_filter

        except ObjectDoesNotExist:
            return

    def post(self, request, **kwargs):
        """
        POST request handler.

        Collects statistics for all courses and present it.

        :returns JsonResponse object.
        """

        page = int(request.GET.get('page', 1)) - 1

        # Columns sorting parameters
        sort_key = request.POST.get('sortKey', 'course')
        ordering = request.POST.get('ordering', 'ASC')

        # Microsites filtering parameters
        ms_selected = request.POST.get('microsite')

        microsites = SiteConfiguration.objects.all().select_related('site')

        if ms_selected:
            microsite_filter = self.get_microsite_filter(microsites, ms_selected)
        else:
            microsite_filter = None

        courses = EnrollmentByDay.objects.extract_analytics_data(
            COUNT_PER_PAGE * page + COUNT_PER_PAGE, page * COUNT_PER_PAGE, sort_key, ordering, microsite_filter
        )

        count_courses = EnrollmentByDay.objects.get_courses_count_by_site(microsite_filter)

        count_pages = count_courses / COUNT_PER_PAGE

        return JsonResponse(
            data={
                "courses": json.dumps(courses),
                "total_metrics": json.dumps(self.get_total_metrics()),
                "count_pages": count_pages if count_pages else 1,
                "current_page": page + 1,
                "microsites_names": [microsite.site.name for microsite in microsites],
                "ms_selected": ms_selected,
            },
            status=200,
            content_type='application/json',
        )


class CsvReportInitializerView(InstructorRequiredMixin, View):
    """
    General csv stats report API view.

    Start generation cvs reports for all:
     - users' metrics
     - enrolled students metrics
     - grade metrics
     for all courses.
    Launch a celery task to generate report.

    Responds with JSON
           {"status": "... status message ...", "task_id": created_task_UUID}

       if initiation is successful (or generation task is already running).

    Responds with BadRequest if problem location is faulty.
    """

    @method_decorator(transaction.non_atomic_requests)
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True))
    @method_decorator(common_exceptions_400)
    def dispatch(self, request, *args, **kwargs):
        return super(CsvReportInitializerView, self).dispatch(request, *args, **kwargs)

    @staticmethod
    def submit_report(csv_generator, request, course_key, *args, **kwargs):
        return {
            'userDataSiteReport': submit_users_features_csv,
            'courseMetricsDataSiteReport': submit_general_enrollment_features_csv,
            'gradeDataSiteReport': submit_general_grade_csv_report,
        }[csv_generator](request, course_key, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """
        POST request handler.

        Collects statistics and generate run celery task to make a csv report.

        :returns JsonResponse object.
        """
        csv_report_generator = request.POST.get("action_name")
        course_key = CourseKeyField.Empty
        message = _(
            'Report generation task for all students of this course has been started. '
            'You can view the status of the generation task in the "Pending Tasks" section.'
            'Report will be downloaded automatically. Please be patient.'
        )
        try:
            task = self.submit_report(csv_report_generator, request, course_key)
        except KeyError:
            return HttpResponseBadRequest("Action name %r does not support." % csv_report_generator)

        response_payload = {'message': message, 'task_id': task.task_id}

        return JsonResponse(response_payload)


@require_POST
@ensure_csrf_cookie
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@require_level('staff')
def list_instructor_tasks(request, course_id, tasks_type):
    """
    List instructor analytics tasks.

    Takes optional query paremeters.
        - With no arguments, lists running tasks.
        - `problem_location_str` lists task history for problem
        - `problem_location_str` and `unique_student_identifier` lists task
        history for problem AND student (intersection)
    """
    course_id = CourseKeyField.Empty if tasks_type == 'general-metrics' else CourseKey.from_string(course_id)

    tasks = get_running_instructor_tasks(course_id)
    response_payload = {'tasks': map(extract_task_features, tasks)}

    return JsonResponse(response_payload)


@require_POST
@ensure_csrf_cookie
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@require_level('staff')
def list_report_downloads(request, course_id, report_type):
    """
    List of links to be able download CSV reports.

    List grade CSV files that are available for download for this course or all courses
    if `report_type` is equal `general-metrics`.

    Takes the following query parameters:
    - report_type - type of the report
    - course_id - course id.
    """
    course_id = None if report_type == 'general-metrics' else CourseKey.from_string(course_id)
    report_store = ReportStore.from_config(config_name='GRADES_DOWNLOAD')
    response_payload = {'downloads': [dict(name=name, url=url) for name, url in report_store.links_for(course_id)]}

    return JsonResponse(response_payload)
