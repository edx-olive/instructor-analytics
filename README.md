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
> - since course start;

- Problems
- Gradebook
- Clusters
- Progress Funnel
- Suggestions

## Installation

`Instructor Analytics` must be installed together with the [Util for the tracking log parsing](https://gitlab.raccoongang.com/rg-developers/instructor-analytics-log-collector/tree/v2.2.0).
 Install this utility from branch `v2.2.0` before installing `Instructor Analytics`.

* Add `rg_instructor_analytics` to the `ADDL_INSTALLED_APPS` in `lms.env.json`
> Note: If you install `Instructor Analytics` with Open edX Ficus Release you also have to add to the `web_fragments` in `ADDL_INSTALLED_APPS`
* Add in to the settings file `lms.env.json`
```
FEATURES['ENABLE_XBLOCK_VIEW_ENDPOINT'] = True
FEATURES['ENABLE_RG_INSTRUCTOR_ANALYTICS'] = True
```
* Add to `edx-platform/lms/urls.py`:
```python
url(
        r'^courses/{}/tab/instructor_analytics/'.format(
            settings.COURSE_ID_PATTERN,
        ),
        include('rg_instructor_analytics.urls'),
        name='instructor_analytics_endpoint',
    ),
```
> Note: url definition must be set *before* url with the name `course_tab_view`

* Apply migration
* Ensure that celerybeat is running
* Set setting for grade cache update, for example:
    * for common.py
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
    ```json
    "FEATURES": {
        ...
        "RG_ANALYTICS_GRADE_CRON_MINUTE": "0",
        "RG_ANALYTICS_GRADE_CRON_HOUR": "*/6",
        "RG_ANALYTICS_GRADE_CRON_DOM": "*",
        "RG_ANALYTICS_GRADE_CRON_DOW": "*",
        "RG_ANALYTICS_GRADE_CRON_MONTH": "*",
        ...
    }
    ```
* Run in the console:
```bash
sudo -sHu edxapp
cd ~
. edxapp_env
pip install -e git+https://github.com/raccoongang/rg_instructor_analytics@master#egg=rg_instructor_analytics
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

##### For run unit test follow the next steps:
* Ensure that the source placed in one of the edx-platform subdirectory.
* cd rg_instructor_analytics
* sh ./test_tool/run_test.sh

