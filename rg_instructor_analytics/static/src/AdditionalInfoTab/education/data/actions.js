import { createAction } from "redux-api-middleware";
import {
  EDUCATION_STATS_FAILURE,
  EDUCATION_STATS_RECEIVED,
  EDUCATION_STATS_REQUEST
} from "./actionTypes";
import { apiUrls, makeHeaders, withParams } from "../../../setupAPI";

export const educationStatsFetching = params =>
  createAction({
    endpoint: withParams(apiUrls.add_info.education, params),
    method: "GET",
    headers: makeHeaders(),
    types: [
      EDUCATION_STATS_REQUEST,
      EDUCATION_STATS_RECEIVED,
      EDUCATION_STATS_FAILURE
    ]
  });
