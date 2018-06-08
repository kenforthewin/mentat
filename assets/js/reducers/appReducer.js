import {persistCombineReducers} from 'redux-persist';
import { routerReducer } from 'react-router-redux';
import storage from 'redux-persist/es/storage';
import userReducer from "./userReducer";
import cryptoReducer from './cryptoReducer'
import messageReducer from './messageReducer'
import usersReducer from './usersReducer'
const config = {
  key: 'root',
  storage,
};

const appReducer = persistCombineReducers(config, {
  routerReducer,
  userReducer,
  cryptoReducer,
  messageReducer,
  usersReducer
});

export default appReducer;