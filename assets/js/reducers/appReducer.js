import {persistCombineReducers} from 'redux-persist';
import { routerReducer } from 'react-router-redux';
import storage from 'redux-persist/es/storage';
import userReducer from "./userReducer";
import cryptoReducer from './cryptoReducer'
const config = {
  key: 'root',
  storage,
};

const appReducer = persistCombineReducers(config, {
  routerReducer,
  userReducer,
  cryptoReducer
});

export default appReducer;