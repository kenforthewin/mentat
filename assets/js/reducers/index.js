import createHistory from 'history/createBrowserHistory'
import { routerMiddleware } from 'react-router-redux'
import { persistStore, persistCombineReducers } from 'redux-persist';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import appReducer from './appReducer';
export const history = createHistory();

const middleware = routerMiddleware(history);
const reducer = appReducer;

export const store = createStore(
    reducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    applyMiddleware(middleware, thunk)
);

export const persistor = persistStore(store);
