import Cookies from "js-cookie";
import querystring from "querystring";
import * as R from "ramda";

export const baseApiUrl = process.env.REACT_APP_BASE_API_URL;
export const addInfoUrl = process.env.REACT_APP_ADD_INFO_URL;

export const withParams = (url, params = {}) =>
  `${url}${R.isEmpty(params) ? "" : "?"}${querystring.stringify(params)}`;

export const withAuth = (headers = {}) => ({
  ...headers,
  "X-CSRFToken": Cookies.get("csrftoken")
});

export const makeHeaders = (headers = {}) => ({
  ...headers,
  "Content-Type": "application/json"
});

// Shadows API routes for development:
export const apiUrls = window.apiUrls || {
  add_info: {
    gender: `${baseApiUrl}${addInfoUrl}/gender/`,
    education: `${baseApiUrl}${addInfoUrl}/education/`,
    age: `${baseApiUrl}${addInfoUrl}/age/`,
    geo: `${baseApiUrl}${addInfoUrl}/geo/`,
    scopes: `${baseApiUrl}${addInfoUrl}/scopes/`
  }
};
