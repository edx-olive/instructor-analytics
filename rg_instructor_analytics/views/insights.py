"""
General metrics stats sub-tab module.
"""

import json
from datetime import datetime, timedelta

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Max, Min, Q
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.generic import View

from lms.djangoapps.certificates.models import GeneratedCertificate
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from rg_instructor_analytics.utils.decorators import instructor_access_required_without_course
from rg_instructor_analytics_log_collector.models import EnrollmentByDay

COUNT_PER_PAGE = getattr(settings, 'ANALYTICS_GENERAL_COUNT_PER_PAGE', 50)


class InsightsStatisticView(View):
    """
    General stats API view.

    Data source: EnrollmentByDay DB model (rg_analytics_collector).
    """

    @method_decorator(instructor_access_required_without_course)
    def dispatch(self, *args, **kwargs):
        """
        Override dispatch method to add method decorator that checks staff or instructor access.
        """

        return super(InsightsStatisticView, self).dispatch(*args, **kwargs)

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

        total_metrics_query = EnrollmentByDay.objects.order_by("course").values('course').annotate(
            total=Max('total'),
            enrolled_max=Max('enrolled'),
            diff_enr_max=Max('enrolled', filter=Q(day__gt=datetime.now() - timedelta(weeks=1))),
            diff_enr_min=Min('enrolled', filter=Q(day__gt=datetime.now() - timedelta(weeks=1))),
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
            COUNT_PER_PAGE * page + COUNT_PER_PAGE,
            page * COUNT_PER_PAGE,
            sort_key,
            ordering,
            microsite_filter
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
            content_type='application/json'
        )
