"""
Admin site bindings for rg_instructor_analytics app.
"""

from django.contrib import admin
from django.utils.translation import ugettext_lazy as _
from eventtracking import tracker

from rg_instructor_analytics import models


class InstructorTabsConfigAdmin(admin.ModelAdmin):
    """
    Django admin class for instructor analytics tabs configuring model.
    """

    list_display = ('user',) + tuple(models.InstructorTabsConfig.get_tabs_names())
    fieldsets = (
        (None, {'fields': ('user',)}),
        (_('Tabs'), {
            'fields': tuple(models.InstructorTabsConfig.get_tabs_names()),
            'description': _(
                'Enabling additional tabs requires extra traffic, '
                'and might affect system activity. '
                'It might take a little time before data is updated.'
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Save model and track event.
        """
        super().save_model(request, obj, form, change)
        track_info = {
            'instructor': str(obj.user),
            'instructor_id': obj.user.id,
            'admin': str(request.user),
            'admin_id': request.user.id,
        }
        track_info.update(dict((f, getattr(obj, f, None)) for f in obj.get_tabs_names()))

        tracker.emit(
            'rg_instructor_analytics.tabs_config.changed',
            track_info
        )


admin.site.register(models.GradeStatistic, admin.ModelAdmin)
admin.site.register(models.LastGradeStatUpdate, admin.ModelAdmin)
admin.site.register(models.InstructorTabsConfig, InstructorTabsConfigAdmin)


@admin.register(models.GenderStats)
class GenderStatsAdmin(admin.ModelAdmin):
    list_display = ['date', 'site', 'total', 'empty']
    date_hierarchy = 'date'
    list_filter = ['site']


@admin.register(models.EducationStats)
class EducationStatsAdmin(admin.ModelAdmin):
    list_display = ['date', 'site', 'total', 'empty']
    date_hierarchy = 'date'
    list_filter = ['site']


@admin.register(models.AgeStats)
class AgeStatsAdmin(admin.ModelAdmin):
    list_display = ['date', 'site', 'total', 'empty']
    date_hierarchy = 'date'
    list_filter = ['site']


@admin.register(models.ResidenceStats)
class ResidenceStatsAdmin(admin.ModelAdmin):
    list_display = ['date', 'site', 'total', 'empty']
    date_hierarchy = 'date'
    list_filter = ['site']
