from os import environ, path

from django_mock_queries.mocks import monkey_patch_test_db

BASE_DIR = path.dirname(path.dirname(path.abspath(__file__)))
ROOT_DIR = path.dirname(BASE_DIR)

SECRET_KEY = environ.get('SECRET_KEY', 'xhs78m@(e)58)&s8)3r(2s+x=jq(p$hdqqnz-ta5)l=#1g*5ju')

DEBUG = True
CELERY_TASK_ALWAYS_EAGER = True

INSTALLED_APPS = []

MAKO_TEMPLATES = {'main': ''}
MAKO_TEMPLATE_DIRS_BASE = ['']

monkey_patch_test_db()
