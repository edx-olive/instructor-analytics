from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

from rg_instructor_analytics.utils.decorators import instructor_access_required_without_course


class InstructorRequiredMixin(object):
    @classmethod
    def as_view(cls, *args, **kwargs):
        view = super(InstructorRequiredMixin, cls).as_view(*args, **kwargs)
        return login_required(view)

    @method_decorator(instructor_access_required_without_course)
    def dispatch(self, *args, **kwargs):
        """
        Override dispatch method to add method decorator that checks staff or instructor access.
        """

        return super(InstructorRequiredMixin, self).dispatch(*args, **kwargs)
