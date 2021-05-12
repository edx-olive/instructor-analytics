"""
Remove usages of opaque_key's from_deprecated_string and to_deprecated_string.
"""


def get_problem_id(xblock):
    """
    Get Locator object for xblock.

    :param xblock: problem
    :return: Locator
    """
    return xblock.location


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


def get_course_key(course_id):
    """
    Return CourseKey object without changes.

    :param course_id: CourseKey object
    :return: CourseKey object
    """
    return course_id
