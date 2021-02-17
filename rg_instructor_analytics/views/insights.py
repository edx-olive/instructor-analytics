"""
General metrics stats sub-tab module.
"""

import json
from datetime import datetime, timedelta

from django.conf import settings
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Case, Count, F, IntegerField, Q, Sum, When
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
from openedx.core.djangoapps.content.course_overviews.models import CourseOverview
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from rg_instructor_analytics.utils.mixins import InstructorRequiredMixin
from rg_instructor_analytics.utils.helpers import get_all_orgs_by_selected_sites, SGA_SITES
from rg_instructor_analytics_log_collector.models import EnrollmentByDay
from student.models import CourseEnrollment


COUNT_PER_PAGE = getattr(settings, 'ANALYTICS_GENERAL_COUNT_PER_PAGE', 50)


class InsightsStatisticView(InstructorRequiredMixin, View):
    """
    General stats API view.

    Data source: EnrollmentByDay DB model (rg_analytics_collector).
    """

    @staticmethod
    def get_total_metrics(courses):
        """
        Method that returns total metrics across all courses or courses for the selected microsite.

        :return: (dict) total metrics.
        example output: {
            "total_enrolled": 20,
            "total_current_enrolled": 18,
            "total_diff_enrolled": 3,
            "certificates": 4,
        }
        """

        week_ago = datetime.now() - timedelta(weeks=1)

        total_metrics = CourseEnrollment.objects.filter(course_id__in=courses).aggregate(
            total_enrolled=Count('id'),
            total_current_enrolled=Sum(Case(When(is_active=True, then=1), default=0, output_field=IntegerField())),
            total_diff_enrolled=
            Sum(Case(When(Q(is_active=True) & Q(created__gt=week_ago), then=1), default=0,
                     output_field=IntegerField())) -
            Sum(Case(When(Q(is_active=False) & Q(created__gt=week_ago), then=1), default=0,
                     output_field=IntegerField())),
        )

        total_metrics.update({"certificates": GeneratedCertificate.objects.filter(course_id__in=courses).count()})

        return total_metrics

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
        microsite_orgs = get_all_orgs_by_selected_sites(ms_selected)
        courses = EnrollmentByDay.objects.extract_analytics_data(
            COUNT_PER_PAGE, page * COUNT_PER_PAGE, sort_key, ordering, microsite_orgs
        )

        courses_by_site = CourseOverview.objects

        if microsite_orgs:
            courses_by_site = courses_by_site.filter(
                Q(org__in=microsite_orgs) | Q(display_org_with_default__in=microsite_orgs)
            )

        courses_ids = courses_by_site.values_list('id', flat=True)

        paginator = Paginator(courses_ids, COUNT_PER_PAGE)

        microsites = SiteConfiguration.objects.filter(enabled=True).values('values', 'site__id', 'site__name').annotate(
            id=F("site__id"), name=F("site__name")
        )

        return JsonResponse(
            data={
                "courses": json.dumps(courses),
                "total_metrics": json.dumps(self.get_total_metrics(courses_ids)),
                "count_pages": paginator.num_pages,
                "current_page": page + 1,
                "microsites": list(microsites),
                "ms_selected": ms_selected if ms_selected == SGA_SITES else int(ms_selected or '0'),
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
    def submit_report(csv_generator, request, course_key, microsite, *args, **kwargs):
        return {
            'userDataSiteReport': submit_users_features_csv,
            'courseMetricsDataSiteReport': submit_general_enrollment_features_csv,
            'gradeDataSiteReport': submit_general_grade_csv_report,
        }[csv_generator](request, course_key, microsite, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """
        POST request handler.

        Collects statistics and generate run celery task to make a csv report.

        :returns JsonResponse object.
        """
        csv_report_generator = request.POST.get("action_name")

        course_key = CourseKeyField.Empty
        microsite = {
            'orgs': get_all_orgs_by_selected_sites(request.POST.get('microsite_id')),
            'name': request.POST.get('microsite_name')
        }
        message = _(
            'Report generation task for all students of this course has been started. '
            'You can view the status of the generation task in the "Pending Tasks" section.'
            'Report will be downloaded automatically. Please be patient.'
        )
        try:
            task = self.submit_report(csv_report_generator, request, course_key, microsite)
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
