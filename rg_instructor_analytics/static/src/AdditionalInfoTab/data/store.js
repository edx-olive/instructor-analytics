import { createStore, applyMiddleware, compose } from 'redux';
import { createMiddleware } from 'redux-api-middleware';

import rootReducer from './pageReducer';

const defaultState = {
  genderStats: [],
  educationStats: [],
  residenceStats: [],
  ageStats: [],
};

const apiMiddleware = createMiddleware();

const enhancers = [applyMiddleware(apiMiddleware)];

// If Redux DevTools Extension is installed use it, otherwise use Redux compose
/* eslint-disable no-underscore-dangle, indent */
const composeEnhancers =
  process.env.NODE_ENV !== 'production' &&
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;
/* eslint-enable */

const configureStore = initialState =>
  createStore(rootReducer, initialState, composeEnhancers(...enhancers));

const store = configureStore(defaultState);

export default store;
