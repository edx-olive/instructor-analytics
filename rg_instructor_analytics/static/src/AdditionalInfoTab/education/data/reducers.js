import {
  EDUCATION_STATS_FAILURE,
  EDUCATION_STATS_RECEIVED
} from "./actionTypes";

const reducer = (state = {}, action) => {
  switch (action.type) {
    case EDUCATION_STATS_RECEIVED:
      return action.payload;
    case EDUCATION_STATS_FAILURE:
      return "error";
    default:
      return state;
  }
};

export default reducer;
