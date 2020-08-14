import { GENDER_STATS_RECEIVED } from './actionTypes';

const reducer = (state = [], action) => {
  switch (action.type) {
    case GENDER_STATS_RECEIVED:
      return action.payload;
    default:
      return state;
  }
};

export default reducer;
