Change Log
__________

..
   All enhancements and patches to rg instructor analytics will be documented
   in this file.  It adheres to the structure of https://keepachangelog.com/ ,
   but in reStructuredText instead of Markdown (for ease of incorporation into
   Sphinx documentation and the PyPI description).

   This project adheres to Semantic Versioning (https://semver.org/).

.. There should always be an "Unreleased" section for changes pending release.

Unreleased
~~~~~~~~~~

* Fix deprecated import path: Importing courseware instead of
  lms.djangoapps.courseware is deprecated.

[v3.0.0] - 2021-06-17 (Koa+ only)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
   * Feature
   * Enhancement
   * Fix
   * Documentation
