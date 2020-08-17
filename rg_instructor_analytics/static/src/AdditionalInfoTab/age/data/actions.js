import { createAction } from "redux-api-middleware";
import {
  AGE_STATS_FAILURE,
  AGE_STATS_RECEIVED,
  AGE_STATS_REQUEST
} from "./actionTypes";
import { apiUrls, makeHeaders, withParams } from "../../../setupAPI";

export const ageStatsFetching = params =>
  createAction({
    endpoint: withParams(apiUrls.add_info.age, params),
    method: "GET",
    headers: makeHeaders(),
    types: [AGE_STATS_REQUEST, AGE_STATS_RECEIVED, AGE_STATS_FAILURE]
  });
