from django.core.management.base import BaseCommand

from rg_instructor_analytics.tasks import collect_demographics as collect_demographics_task


class Command(BaseCommand):
    """
    Populate demographic related models (GenderStats, EducationStats, AgeStats, ResidenceStats).

    usage:
    ./manage.py lms collect_demographics
    """

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Collecting statistics...'))
        collect_demographics_task()
        self.stdout.write(self.style.SUCCESS('...completed!'))
