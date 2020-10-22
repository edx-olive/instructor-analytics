import { createStore, applyMiddleware, compose } from "redux";
import { createMiddleware } from "redux-api-middleware";
import defaultState from "./setupStore";

import rootReducer from "./tabReducer";

const apiMiddleware = createMiddleware();

const enhancers = [applyMiddleware(apiMiddleware)];

// If Redux DevTools Extension is installed use it, otherwise use Redux compose
/* eslint-disable no-underscore-dangle, indent */
const composeEnhancers =
  process.env.NODE_ENV !== "production" &&
  typeof window === "object" &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;
/* eslint-enable */

const configureStore = initialState =>
  createStore(rootReducer, initialState, composeEnhancers(...enhancers));

const store = configureStore(defaultState);

export default store;
