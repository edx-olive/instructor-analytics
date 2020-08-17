import { AGE_STATS_FAILURE, AGE_STATS_RECEIVED } from "./actionTypes";

const reducer = (state = {}, action) => {
  switch (action.type) {
    case AGE_STATS_RECEIVED:
      return action.payload;
    case AGE_STATS_FAILURE:
      return "error";
    default:
      return state;
  }
};

export default reducer;
