import { AGE_STATS_RECEIVED } from './actionTypes';

const reducer = (state = [], action) => {
  switch (action.type) {
    case AGE_STATS_RECEIVED:
      return action.payload;
    default:
      return state;
  }
};

export default reducer;
