import { createAction } from 'redux-api-middleware';
import {
  GENDER_STATS_FAILURE,
  GENDER_STATS_RECEIVED,
  GENDER_STATS_REQUEST,
} from './actionTypes';
import api from './api/endpoints';
import { withAuth } from '../../../context';

export const genderStatsFetching = () =>
  createAction({
    endpoint: api.genderStats,
    method: 'POST',
    headers: withAuth({}),
    body: JSON.stringify({}),
    types: [GENDER_STATS_REQUEST, GENDER_STATS_RECEIVED, GENDER_STATS_FAILURE],
  });
