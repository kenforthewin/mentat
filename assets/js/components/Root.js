import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';
import {store, persistor, history} from '../reducers/index';
import Main from './Main'

class Root extends Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <Main history={history}/>
        </PersistGate>
      </Provider>
    );
  }
}

export default Root;