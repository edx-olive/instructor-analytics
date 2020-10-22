import { createAction } from "redux-api-middleware";
import {
  GEO_STATS_FAILURE,
  GEO_STATS_RECEIVED,
  GEO_STATS_REQUEST
} from "./actionTypes";
import { apiUrls, makeHeaders, withParams } from "../../../setupAPI";

export const geoStatsFetching = params =>
  createAction({
    endpoint: withParams(apiUrls.add_info.geo, params),
    method: "GET",
    headers: makeHeaders(),
    types: [GEO_STATS_REQUEST, GEO_STATS_RECEIVED, GEO_STATS_FAILURE]
  });
