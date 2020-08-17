import { createAction } from "redux-api-middleware";
import {
  GENDER_STATS_FAILURE,
  GENDER_STATS_RECEIVED,
  GENDER_STATS_REQUEST
} from "./actionTypes";
import { apiUrls, makeHeaders, withParams } from "../../../setupAPI";

export const genderStatsFetching = params =>
  createAction({
    endpoint: withParams(apiUrls.add_info.gender, params),
    method: "GET",
    headers: makeHeaders(),
    types: [GENDER_STATS_REQUEST, GENDER_STATS_RECEIVED, GENDER_STATS_FAILURE]
  });
