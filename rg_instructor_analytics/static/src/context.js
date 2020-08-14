import Cookies from 'js-cookie';

export const baseApiUrl =
  '/courses/course-v1:edX+DemoX+Demo_Course/tab/instructor_analytics/api/';

// Shadows API routes for development:
export const apiUrls = window.apiUrls || {
  add_info: {
    gender: `${baseApiUrl}additional-info/gender/`,
    education: `${baseApiUrl}additional-info/education/`,
    age: `${baseApiUrl}additional-info/age/`,
    residence: `${baseApiUrl}additional-info/residence/`,
  },
};

export const withAuth = (headers = {}) => ({
  ...headers,
  'Content-Type': 'application/json',
  'X-CSRFToken': Cookies.get('csrftoken'),
});
