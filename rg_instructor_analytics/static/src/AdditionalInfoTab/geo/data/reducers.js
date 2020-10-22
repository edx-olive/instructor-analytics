import { GEO_STATS_FAILURE, GEO_STATS_RECEIVED } from "./actionTypes";

const reducer = (state = {}, action) => {
  switch (action.type) {
    case GEO_STATS_RECEIVED:
      return action.payload;
    case GEO_STATS_FAILURE:
      return "error";
    default:
      return state;
  }
};

export default reducer;
