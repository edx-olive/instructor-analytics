"""
Common settings variables are required by the rg_instructor_analytics.
"""
from logging import getLogger
import os
from path import Path


log = getLogger(__name__)


def plugin_settings(settings):
    """
    Settings for rg_instructor_analytics
    """
    settings.RG_ANALYTICS_GRADE_STAT_UPDATE = {
        'minute': '0',
        'hour': '*/6',
        'day_of_week': '*',
        'day_of_month': '*',
        'month_of_year': '*',
    }
    settings.FEATURES['ENABLE_XBLOCK_VIEW_ENDPOINT'] = True
    settings.FEATURES['ENABLE_RG_INSTRUCTOR_ANALYTICS'] = True

    APP_ROOT = Path(__file__).dirname()
    ANALYTICS_TEMPLATE_DIR = os.path.join(APP_ROOT, 'templates')
    settings.MAKO_TEMPLATE_DIRS_BASE.append(ANALYTICS_TEMPLATE_DIR)
