Change Log
__________

..
   All enhancements and patches to rg instructor analytics will be documented
   in this file.  It adheres to the structure of https://keepachangelog.com/ ,
   but in reStructuredText instead of Markdown (for ease of incorporation into
   Sphinx documentation and the PyPI description).

   This project adheres to Semantic Versioning (https://semver.org/).

.. There should always be an "Unreleased" section for changes pending release.

[Unreleased]

[Fix] - 2022-03-21
* Fix: date format for the "All Enrollments" tab
    * YT: https://youtrack.raccoongang.com/issue/RGOeX-811

[Fix] - 2022-03-18
* Fix: delete mobile screen width

  * YT: https://youtrack.raccoongang.com/issue/RGOeX-934

* Docs: update README with info about RG_ANALYTICS_GRADE_STAT_UPDATE changes (related to RGA-274)

[Fix] - 2022-03-17
* Fix: course filter doesn't work on all tabs except the first one

  * YT: https://youtrack.raccoongang.com/issue/RGOeX-812

* Docs: update README with info about RG_ANALYTICS_GRADE_STAT_UPDATE changes (related to RGA-274)

[Fix] - 2022-03-16
* Fix: data update takes too long

  * grouped all the `RG_ANALYTICS_GRADE_CRON_<timespan>` settings to the dict `RG_ANALYTICS_GRADE_STAT_UPDATE`
  (similar to the `settings.RG_ANALYTICS_GRADE_STAT_UPDATE`)
  * relates to the deployment MR (https://gitlab.raccoongang.com/owlox-team/maple/deployment/-/merge_requests/15)
  * YT: https://youtrack.raccoongang.com/issue/RGA-274

[v3.4.2] - 2022-03-16
~~~~~~~~~~~~~~~~~~~~~
* Fix Gender tooltip

- Fixed Gender tooltip aligment in additional information tab

[v3.4.1] - 2022-03-06
~~~~~~~~~~~~~~~~~~~~~
* Fix empty message title styles

[v3.4.0] - 2022-01-20
~~~~~~~~~~~~~~~~~~~~~
* Feature Add Full Responsive

- Added Responsive for each analytics static tab and each Highcharts graphs
- Added Responsive for Additional Information React App
- Checked RTL for responsive

[v3.3.0] - 2021-12-01
~~~~~~~~~~~~~~~~~~~~~
Prepare changes to make RG IA become compatible with Django 3 and in consequece
Maple release.

* Fix render_to_response Django shortcut which was deprecated in Django 2
and finally removed in Django 3
* Fix data included to the package.
* Fix styling issues.

[v3.2.1] - 2021-11-12
~~~~~~~~~~~~~~~~~~~~~
Fix grammar mistakes in the reports` descriptions.

[v3.2.0] - 2021-11-4
~~~~~~~~~~~~~~~~~~~~
* Add Vietnamese translations
* Fix URLs config: remove redundant namespace from the included pattern_list
* Fix course order in the Course Selection Tab

[v3.1.1] - 2021-07-30
~~~~~~~~~~~~~~~~~~~~~
* Fix scorm assessment in course analytics statistics

[v3.1.0] - 2021-07-08
~~~~~~~~~~~~~~~~~~~~~
* Feature Add Installable App Options
* Docs: GitLab MR Template is added

- fixed hover on chart elements in the problem tab
- fixed chart position xAxis activity tab

[v3.0.0] - 2021-06-17 (Koa+ only)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Fix deprecated `base_name` parameter in DRF `Router.register` method.
* Fix deprecated import path: Importing courseware instead of
  lms.djangoapps.courseware is deprecated.
* Full migration from Py2 to Py3, Py2 based OeX releases are not supported.
* Add AR translation files.
* Add RTL support to the Additional information tab.
* Hide email recipients from each other
* Fix an error with unsupported countries on the World map.
* Remove unsupported OeX releases from the codebase.

[Documentation|Enhancement] - 2021-06-16
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* CHANGELOG is added!

* For the upcoming logs please use the following tags:
   * Feat
   * Enhancement
   * Fix
   * Documentation
