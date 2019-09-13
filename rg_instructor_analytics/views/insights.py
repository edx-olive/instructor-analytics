"""
General metrics stats sub-tab module.
"""

import json
from datetime import datetime, timedelta

from django.conf import settings
from django.db.models import Max, Min, Q
from django.http import JsonResponse
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.generic import View

from lms.djangoapps.certificates.models import GeneratedCertificate
from openedx.features.course_experience import course_home_url_name
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
    def generate_query(limit, offset):
        """
        Helper method that generates raw query for sql request.


        :param limit: (int) Query limit
        :param offset: (int) Query offset
        :return: (str) sql query for the request.
        """

        return """
            SELECT 
            enrollment_by_day.id,
            enrollment_by_day.course,
            MIN(enrollment_by_day.enrolled)             AS diff_enr_min,
            MAX(enrollment_by_day.enrolled)             AS diff_enr_max,
            MAX(enrollment_by_day.total)                AS total,
            MAX(enrollment_by_day.enrolled)             AS enrolled_max,
            course_overview.start                       AS start,
            course_overview.end                         AS end,
            course_overview.lowest_passing_grade        AS lowest_passing_grade,
            generated_certificates.certificates_count   AS cert_count,
            SUM(
                CASE WHEN 
                    grade_statistic.total > course_overview.lowest_passing_grade 
                THEN 1 
                ELSE 0 END
                ) AS total_passing
            FROM rg_instructor_analytics_log_collector_enrollmentbyday AS enrollment_by_day
                LEFT JOIN course_overviews_courseoverview AS course_overview
                    ON enrollment_by_day.course = course_overview.id
                LEFT JOIN (
                    SELECT generated_certificates.course_id,
                        COUNT(generated_certificates.id) AS certificates_count
                    FROM certificates_generatedcertificate AS generated_certificates
                    GROUP BY generated_certificates.id
                    ) generated_certificates
                    ON enrollment_by_day.course =  generated_certificates.course_id
                LEFT JOIN rg_instructor_analytics_gradestatistic AS grade_statistic
                    ON enrollment_by_day.course = grade_statistic.course_id
            GROUP BY enrollment_by_day.course
            ORDER BY enrollment_by_day.course ASC
            LIMIT {limit} OFFSET {offset};
        """.format(limit=limit, offset=offset)

    def post(self, request, **kwargs):
        """
        POST request handler.

        Collects statistics for all courses and present it.

        :returns JsonResponse object.
        """

        page = int(request.GET.get('page', 1)) - 1

        courses = EnrollmentByDay.objects.raw(
            self.generate_query(COUNT_PER_PAGE * page + COUNT_PER_PAGE, page * COUNT_PER_PAGE)
        )

        output = []

        for course in courses:
            output.append(
                {
                    "name": str(course.course),
                    "course_url": reverse(course_home_url_name(course.course), args=[unicode(course.course)]),
                    "total": int(course.total),
                    "enrolled_max": int(course.enrolled_max),
                    "week_change": int(course.diff_enr_max - course.diff_enr_min),
                    "start_date": course.start.strftime("%m/%d/%Y") if course.start is not None else '-',
                    "end_date": course.end.strftime("%m/%d/%Y") if course.end is not None else '-',
                    "certificates": int(course.cert_count) if course.cert_count is not None else 0,
                    "count_graded": int(course.total_passing)
                }
            )

        count_pages = (len(output) + COUNT_PER_PAGE) // COUNT_PER_PAGE

        return JsonResponse(
            data={
                "courses": json.dumps(output),
                "total_metrics": json.dumps(self.get_total_metrics()),
                "count_pages": count_pages,
                "current_page": int(request.GET.get("page"))
            }
        )
