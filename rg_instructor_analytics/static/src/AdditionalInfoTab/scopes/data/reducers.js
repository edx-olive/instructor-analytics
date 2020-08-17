import * as R from "ramda";
import {
  DATA_SCOPES_COURSE_TOGGLED,
  DATA_SCOPES_RECEIVED,
  DATA_SCOPES_SCOPE_TOGGLED,
  DATA_SCOPES_SITE_TOGGLED
} from "./actionTypes";

export const getDefaultState = () => {
  return {
    scopes: { system: null },
    roles: { admin: null },
    role: null,
    scope: null,
    site: null,
    course: null,
    sites: [],
    courses: []
  };
};

const reducer = (state = getDefaultState(), action) => {
  switch (action.type) {
    case DATA_SCOPES_RECEIVED:
      const data = action.payload;
      return {
        // Set initial values as first item in each data set:
        course: !R.isEmpty(data.courses) ? data.courses[0].id : null,
        site: !R.isEmpty(data.sites) ? data.sites[0].id : null,
        ...data
      };
    case DATA_SCOPES_SCOPE_TOGGLED:
      return { ...state, scope: action.payload };
    case DATA_SCOPES_SITE_TOGGLED:
      return { ...state, site: action.payload };
    case DATA_SCOPES_COURSE_TOGGLED:
      return { ...state, course: action.payload };
    default:
      return state;
  }
};

export default reducer;
