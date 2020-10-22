import { combineReducers } from 'redux';
import genderReducer from '../gender/data/reducers';
import educationReducer from '../education/data/reducers';
import geoReducer from '../geo/data/reducers';
import ageReducer from '../age/data/reducers';

const rootReducer = combineReducers({
  genderStats: genderReducer,
  educationStats: educationReducer,
  geoStats: geoReducer,
  ageStats: ageReducer,
});

export default rootReducer;
