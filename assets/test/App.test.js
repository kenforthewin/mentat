import React from 'react';
import {Dropdown,Modal} from 'semantic-ui-react'
import ChatSegment from '../js/components/ChatSegment';
import App from '../js/components/App';
import renderer from 'react-test-renderer';
import {mockDecryptedMessages, initialState} from './mocks/index';
import configureStore from 'redux-mock-store'
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {Provider} from 'react-redux'
import thunk from 'redux-thunk';
import uuidv1 from 'uuid'
import userReducer from '../js/reducers/userReducer';
import cryptoReducer from '../js/reducers/cryptoReducer';
import {combineReducers,applyMiddleware,createStore} from 'redux';
import {generateKeypair} from '../js/actions/cryptoActions';
let store,container;
Enzyme.configure({ adapter: new Adapter() })

describe('App', () => {

  beforeAll(()=>{
    window.crypto = { getRandomValues: () => { return [3209438127,3209438127,3209438127,3209438127]} }
    store = createStore(
      combineReducers({userReducer, cryptoReducer}),
      applyMiddleware(thunk)
    )  
    container = shallow(
      <App store={store} match={{params: {room: 'lobby'}}}/>
    );
  })

  it('Renders app', () => {
    expect(container.dive().find(Modal).length).toEqual(1);
    expect(container.dive().find(ChatSegment).length).toEqual(0);
  })

  it('Generates a personal keypair', () => {
    store.dispatch({
      type: 'new_key',
      publicKey: 'aaa',
      privateKey: 'bb',
      passphrase: 'ccc'
    });
    let state = store.getState();
    expect(state.cryptoReducer.privateKey).toBeTruthy();
    store.dispatch({
      type: 'new_group_key',
      publicKey: 'aaa',
      privateKey: 'bb',
      room: 'lobby'
    });
    state = store.getState();
    expect(state.cryptoReducer.groups['lobby'].privateKey).toBeTruthy();
    store.dispatch({
      type: 'set_name',
      name: 'Test',
      color: '#aaa'
    })
    state = store.getState();
    container.update();
    expect(state.userReducer.name).toBeTruthy();
    expect(container.dive().find(ChatSegment).length).toEqual(1);
  })
})
