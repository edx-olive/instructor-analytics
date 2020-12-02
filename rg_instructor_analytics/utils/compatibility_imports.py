try:
    from openedx.core.release import RELEASE_LINE
except ImportError:
    RELEASE_LINE = 'ficus'


if RELEASE_LINE == 'juniper':
    import lms.djangoapps.discussion.django_comment_client.utils as comment_utils
    from lms.djangoapps.courseware.models import StudentModule
else:
    from courseware.models import StudentModule
    import lms.djangoapps.django_comment_client.utils as comment_utils


if RELEASE_LINE == 'ficus' or RELEASE_LINE == 'ginkgo':
    from rg_instructor_analytics.utils import ginkgo_ficus_specific as specific
elif RELEASE_LINE == 'hawthorn' or RELEASE_LINE == 'ironwood':
    from rg_instructor_analytics.utils import hawthorn_specific as specific
else:  # juniper and newer
    from rg_instructor_analytics.utils import juniper_specific as specific
