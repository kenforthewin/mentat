import {persistCombineReducers} from 'redux-persist';
import { routerReducer } from 'react-router-redux';
import storage from 'redux-persist/es/storage';

const config = {
  key: 'root',
  storage,
};

const appReducer = persistCombineReducers(config, {
  routerReducer
});

export default appReducer;