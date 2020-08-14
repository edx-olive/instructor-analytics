import { createAction } from 'redux-api-middleware';
import {
  EDUCATION_STATS_FAILURE,
  EDUCATION_STATS_RECEIVED,
  EDUCATION_STATS_REQUEST,
} from './actionTypes';
import api from './api/endpoints';
import { withAuth } from '../../../context';

export const educationStatsFetching = () =>
  createAction({
    endpoint: api.educationStats,
    method: 'POST',
    headers: withAuth({}),
    body: JSON.stringify({ site_id: 1 }),
    types: [EDUCATION_STATS_REQUEST, EDUCATION_STATS_RECEIVED, EDUCATION_STATS_FAILURE],
  });
