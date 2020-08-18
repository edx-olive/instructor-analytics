import {
  DATA_SCOPES_COURSE_TOGGLED,
  DATA_SCOPES_FAILURE,
  DATA_SCOPES_RECEIVED,
  DATA_SCOPES_REQUEST,
  DATA_SCOPES_SCOPE_TOGGLED,
  DATA_SCOPES_SITE_TOGGLED
} from "./actionTypes";
import { createAction } from "redux-api-middleware";
import { apiUrls, withParams } from "../../../setupAPI";

export const scopeToggling = scope => ({
  type: DATA_SCOPES_SCOPE_TOGGLED,
  payload: scope
});

export const siteToggling = site => ({
  type: DATA_SCOPES_SITE_TOGGLED,
  payload: site
});

export const courseToggling = course => ({
  type: DATA_SCOPES_COURSE_TOGGLED,
  payload: course
});

export const scopesFetching = params =>
  createAction({
    endpoint: withParams(apiUrls.add_info.scopes, params),
    method: "GET",
    headers: { "Content-Type": "application/json" },
    types: [DATA_SCOPES_REQUEST, DATA_SCOPES_RECEIVED, DATA_SCOPES_FAILURE]
  });
