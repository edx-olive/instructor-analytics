import { createAction } from 'redux-api-middleware';
import {
  RESIDENCE_STATS_FAILURE,
  RESIDENCE_STATS_RECEIVED,
  RESIDENCE_STATS_REQUEST,
} from './actionTypes';
import api from './api/endpoints';
import { withAuth } from '../../../context';

export const residenceStatsFetching = () =>
  createAction({
    endpoint: api.residenceStats,
    method: 'POST',
    headers: withAuth({}),
    body: JSON.stringify({ site_id: 1 }),
    types: [RESIDENCE_STATS_REQUEST, RESIDENCE_STATS_RECEIVED, RESIDENCE_STATS_FAILURE],
  });
