"""
Remove usages of opaque_key's from_deprecated_string and to_deprecated_string
"""

from rg_instructor_analytics.utils.hawthorn_specific import get_problem_id, get_course_key


def get_problem_str(problem_id):
    """
    Get string form problem's Location.

    :param problem_id: Locator
    :return: string
    """
    return str(problem_id)


def get_block_str(block):
    """
    Convert block location to string.

    :praram block: block usage key
    :return: block location string
    """
    return str(block.location)
