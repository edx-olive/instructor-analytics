import { combineReducers } from 'redux';
import genderReducer from '../gender/data/reducers';
import educationReducer from '../education/data/reducers';
import residenceReducer from '../residence/data/reducers';
import ageReducer from '../age/data/reducers';

const rootReducer = combineReducers({
  genderStats: genderReducer,
  educationStats: educationReducer,
  residenceStats: residenceReducer,
  ageStats: ageReducer,
});

export default rootReducer;
