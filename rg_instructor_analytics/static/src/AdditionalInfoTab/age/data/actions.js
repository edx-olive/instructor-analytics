import { createAction } from 'redux-api-middleware';
import {
  AGE_STATS_FAILURE,
  AGE_STATS_RECEIVED,
  AGE_STATS_REQUEST,
} from './actionTypes';
import api from './api/endpoints';
import { withAuth } from '../../../context';

export const ageStatsFetching = () =>
  createAction({
    endpoint: api.ageStats,
    method: 'POST',
    headers: withAuth({}),
    body: JSON.stringify({ site_id: 1 }),
    types: [AGE_STATS_REQUEST, AGE_STATS_RECEIVED, AGE_STATS_FAILURE],
  });
