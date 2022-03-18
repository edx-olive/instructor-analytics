# RaccoonGang Instructor Analytics

## Description

This django application extends OpenEdx LMS staff functionality.
It adds extra navigation `Instructor analytics` tab for instructors (next to `Instructor`).
`Instructor analytics` tab includes following sections (sub-tabs):

- Enrollment stats:

  > `enrollments`/`unenrollments` count given separately for each Course time-sliced by:
  > - arbitrary period;
  > - last week;
  > - last two weeks;
  > - last month;
  > - since course start.

- Activities
- Problems
- Student's Info
- Clusters
- Progress Funnel
- Suggestions
- Additional Information

## Installation

`Instructor Analytics` must be installed together with the [Util for the tracking log parsing](https://gitlab.raccoongang.com/rg-developers/instructor-analytics-log-collector/-/tags).
 Install this utility with the same tag.

`Instructor Analytics` is OeX installable app so to install application it
should be added to the venv via `pip install` command.

* Apply migration (if needed)
* Ensure that celerybeat is running
* The default setting for grade cache update could be changed in the deployment
  configurations or directly in lms.envs.<env_settings>:
    * for common.py (defaults are)
    ```python
    RG_ANALYTICS_GRADE_STAT_UPDATE = {
        'minute': '0',
        'hour': '*/6',
        'day_of_week': '*',
        'day_of_month': '*',
        'month_of_year': '*',
    }
    ```
    * or provide settings in `FEATURES`
    ```yaml
    FEATURES:
        ...
        RG_ANALYTICS_GRADE_STAT_UPDATE:
          minute: '*/15'
          hour: '*'
          day_of_month: '*'
          day_of_week: '*'
          month_of_year: '*'
        ...
    ```
* The default settings for `RG_ANALYTICS_DEMOGRAPHICS_SCHEDULE` is a dict in the
  `FEATURES` for example:
    * for common.py (defaults are)
    ```python
        FEATURES['RG_ANALYTICS_DEMOGRAPHICS_SCHEDULE'] = {
            'minute': '0',
            'hour': '*/6',
            'day_of_month': '*',
            'day_of_week': '*',
            'month_of_year': '*',
        }
    ```
* Run in the console:
```bash
sudo -sHu edxapp
cd ~
. edxapp_env
pip install git+https://github.com/raccoongang/rg_instructor_analytics@v3.x.x#egg=rg_instructor_analytics
cd edx-platform
python ./manage.py lms collectstatic --settings=$EDX_PLATFORM_SETTINGS --noinput
exit
sudo /edx/bin/supervisorctl restart edxapp:lms
```

##### After installation run next code in Django shell (warning this tasks can take time)
```python
from rg_instructor_analytics.tasks import grade_collector_stat

grade_collector_stat()
```

## Microsites

for microsite configurations use this flag for enable/disable tab: `ENABLE_RG_INSTRUCTOR_ANALYTICS`

## Unit tests
All tests could be run only in local.

#### For run unit test follow the next steps:
from project root directory
* install requirements from requirements_test.txt.
* run ```export PYTHONPATH=$(pwd):$PYTHONPATH```
* run ```pytest rg_instructor_analytics/tests -s -v -c rg_instructor_analytics/pytest.ini```

DevOps: https://raccoongang.atlassian.net/wiki/spaces/tech/pages/1237057564/RG+Analytics+2.0+installation+manual
