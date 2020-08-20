"""
Models of the rg analytics.
"""
import collections
import logging

from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.db import models
from django.utils.translation import ugettext_lazy as _
from jsonfield.fields import JSONField
from opaque_keys import InvalidKeyError
from opaque_keys.edx.keys import CourseKey
from openedx.core.djangoapps.xmodule_django.models import CourseKeyField

from rg_instructor_analytics.utils import get_courses_learners, aggregate_users_stats
from student.models import CourseEnrollment

log = logging.getLogger(__name__)

# IDEA: make these categories configurable from admin site
GENERATION_CHOICES = collections.OrderedDict((
    ('z', _("Generation Z: 1995-2012")),
    ('m', _("Millenials: 1980-1994")),
    ('x', _("Generation X: 1965-1979")),
    ('b', _("Baby boomers: 1942-1964")),
))

LEVEL_OF_EDUCATION_CHOICES = collections.OrderedDict({
    'p': _("Academic degree"),
    'm': _("Master's degree on specialty"),
    'b': _("Undergraduate"),
    'a': _("Incomplete higher education"),
    'hs': _("The average"),
    'jhs': _("Incomplete secondary"),
    'el': _("Initial"),
    'none': _("No formal education"),
    'other': _("Other education"),
})

GENDER_CHOICES = collections.OrderedDict({
    'm': _("Male"),
    'o': _("Other"),
    'f': _("Female"),
})


class GradeStatistic(models.Model):
    """
    Model for store grades of the student for each course.
    """

    course_id = CourseKeyField(max_length=255, db_index=True)
    student = models.ForeignKey(User)
    exam_info = models.TextField()
    # Represent total grade in range from 0 to 1; [0; 1]
    total = models.FloatField()

    class Meta:
        """
        Meta class.
        """

        unique_together = ('course_id', 'student',)

    @property
    def is_enrolled(self):
        """
        Return True if the user is enrolled in the course. Otherwise, returns False.
        """
        return CourseEnrollment.is_enrolled(self.student, self.course_id)


# TODO replace this table with the Redis.
class LastGradeStatUpdate(models.Model):
    """
    For the calculation diffs for the update.
    """

    last_update = models.DateTimeField(db_index=True)


class InstructorTabsConfig(models.Model):
    """
    Model for configuring instructor analytics tabs.
    """

    user = models.OneToOneField(User, verbose_name=_('Instructor'))
    enrollment_stats = models.BooleanField(default=True, verbose_name=_('Enrollment stats'))
    activities = models.BooleanField(default=True, verbose_name=_('Activities'))
    problems = models.BooleanField(default=True, verbose_name=_('Problems'))
    students_info = models.BooleanField(default=True, verbose_name=_('Students\' Info'))
    clusters = models.BooleanField(default=True, verbose_name=_('Clusters'))
    progress_funnel = models.BooleanField(default=True, verbose_name=_('Progress Funnel'))
    suggestions = models.BooleanField(default=True, verbose_name=_('Suggestions'))
    add_info = models.BooleanField(default=True, verbose_name=_('Additional Info'))

    @classmethod
    def get_tabs_names(cls):
        """
        Return all tabs names.
        """
        return [f.name for f in cls._meta.get_fields() if f.name not in ('user', 'id')]

    @classmethod
    def tabs_for_user(cls, user):
        """
        Return enabled tabs names.
        """
        fields = cls.get_tabs_names()
        try:
            conf = cls.objects.get(user=user).__dict__
        except cls.DoesNotExist:
            return fields
        else:
            return [k for k, v in conf.items() if k in fields and v]

    def __unicode__(self):
        """
        Return human readable object name.
        """
        return "Tabs config for user: {}".format(self.user)


class GenderStats(models.Model):
    """
    Model for collecting gender statistics per Site.
    """
    site = models.ForeignKey(Site, related_name='gender_stats', on_delete=models.CASCADE,
                             db_index=True, null=True, blank=True)
    total = models.PositiveIntegerField(verbose_name=_("total users"), default=0)
    empty = models.PositiveIntegerField(verbose_name=_("no data"), default=0)
    values = JSONField(null=False, blank=True, load_kwargs={'object_pairs_hook': collections.OrderedDict})
    date = models.DateField(_("date"))

    class Meta(object):
        verbose_name = _("gender statistics")
        verbose_name_plural = _("gender statistics")
        unique_together = ('site', 'date')
        ordering = ['date']

    def __unicode__(self):
        return "{}-{}".format(self.site, self.date.strftime("%Y-%m-%d"))

    @classmethod
    def for_course(cls, course_key):
        try:
            course_usage_key = CourseKey.from_string(course_key)
            users_ids = get_courses_learners([course_usage_key])
            return aggregate_users_stats(users_ids, 'gender')
        except InvalidKeyError:
            log.error("Got bad value for course key: %s. Couldn't fetch gender stats for course!", course_key)
            return {'error': 'bad course_key'}

    @classmethod
    def for_site(cls, site_id):
        stats = cls.objects.filter(site_id=site_id).last()
        return stats.values if stats else collections.OrderedDict()

    @classmethod
    def for_date(cls, date_filter=None):
        stats = cls.objects.filter(site__isnull=True)
        if date_filter:
            stats.filter(date=date_filter)
        return stats.last().values if stats else {}


class EducationStats(models.Model):
    """
    Model for collecting users' education level statistics per Site.
    """
    site = models.ForeignKey(Site, related_name='education_stats', on_delete=models.CASCADE,
                             db_index=True, null=True, blank=True)
    total = models.PositiveIntegerField(verbose_name=_("total users"), default=0)
    empty = models.PositiveIntegerField(verbose_name=_("no data"), default=0)
    values = JSONField(null=False, blank=True, load_kwargs={'object_pairs_hook': collections.OrderedDict})
    date = models.DateField(_("date"))

    class Meta(object):
        verbose_name = _("education statistics")
        verbose_name_plural = _("education statistics")
        unique_together = ('site', 'date')
        ordering = ['date']

    def __unicode__(self):
        return "{}-{}".format(self.site, self.date.strftime("%Y-%m-%d"))

    @classmethod
    def for_course(cls, course_key):
        try:
            course_usage_key = CourseKey.from_string(course_key)
            users_ids = get_courses_learners([course_usage_key])
            return aggregate_users_stats(users_ids, 'level_of_education')
        except InvalidKeyError:
            log.error(
                "Got bad value for course key: %s. Couldn't fetch level of education stats for course!", course_key
            )
            return {'error': 'bad course_key'}

    @classmethod
    def for_site(cls, site_id):
        stats = cls.objects.filter(site_id=site_id).last()
        return stats.values if stats else collections.OrderedDict()

    @classmethod
    def for_date(cls, date_filter=None):
        stats = cls.objects.filter(site__isnull=True)
        if date_filter:
            stats.filter(date=date_filter)
        return stats.last().values if stats else {}


class AgeStats(models.Model):
    """
    Model for collecting users' year of birth statistics per Site.
    """
    site = models.ForeignKey(Site, related_name='age_stats', on_delete=models.CASCADE,
                             db_index=True, null=True, blank=True)
    total = models.PositiveIntegerField(verbose_name=_("total users"), default=0)
    empty = models.PositiveIntegerField(verbose_name=_("no data"), default=0)
    values = JSONField(null=False, blank=True, load_kwargs={'object_pairs_hook': collections.OrderedDict})
    date = models.DateField(_("date"))

    class Meta(object):
        verbose_name = _("age statistics")
        verbose_name_plural = _("age statistics")
        unique_together = ('site', 'date')
        ordering = ['date']

    def __unicode__(self):
        return "{}-{}".format(self.site, self.date.strftime("%Y-%m-%d"))

    @classmethod
    def for_course(cls, course_key):
        try:
            course_usage_key = CourseKey.from_string(course_key)
            users_ids = get_courses_learners([course_usage_key])
            return aggregate_users_stats(users_ids, 'year_of_birth')
        except InvalidKeyError:
            log.error("Got bad value for course key: %s. Couldn't fetch year of birth stats for course!", course_key)
            return {'error': 'bad course_key'}

    @classmethod
    def for_site(cls, site_id):
        stats = cls.objects.filter(site_id=site_id).last()
        return stats.values if stats else collections.OrderedDict()

    @classmethod
    def for_date(cls, date_filter=None):
        stats = cls.objects.filter(site__isnull=True)
        if date_filter:
            stats.filter(date=date_filter)
        return stats.last().values if stats else {}


class ResidenceStats(models.Model):
    """
    Model for collecting users' country of residence statistics per Site.
    """
    site = models.ForeignKey(Site, related_name='residence_stats', on_delete=models.CASCADE,
                             db_index=True, null=True, blank=True)
    total = models.PositiveIntegerField(verbose_name=_("total users"), default=0)
    empty = models.PositiveIntegerField(verbose_name=_("no data"), default=0)
    values = JSONField(null=False, blank=True, load_kwargs={'object_pairs_hook': collections.OrderedDict})
    date = models.DateField(_("date"))

    class Meta(object):
        verbose_name = _("geo statistics")
        verbose_name_plural = _("geo statistics")
        unique_together = ('site', 'date')
        ordering = ['date']

    def __unicode__(self):
        return "{}-{}".format(self.site, self.date.strftime("%Y-%m-%d"))

    @classmethod
    def for_course(cls, course_key):
        try:
            course_usage_key = CourseKey.from_string(course_key)
            users_ids = get_courses_learners([course_usage_key])
            return aggregate_users_stats(users_ids, 'country')
        except InvalidKeyError:
            log.error("Got bad value for course key: %s. Couldn't fetch country stats for course!", course_key)
            return {'error': 'bad course_key'}

    @classmethod
    def for_site(cls, site_id):
        stats = cls.objects.filter(site_id=site_id).last()
        return stats.values if stats else collections.OrderedDict()

    @classmethod
    def for_date(cls, date_filter=None):
        stats = cls.objects.filter(site__isnull=True)
        if date_filter:
            stats.filter(date=date_filter)
        return stats.last().values if stats else {}
