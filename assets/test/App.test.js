import React from 'react';
import {Dropdown} from 'semantic-ui-react'
import ChatSegment from '../js/components/ChatSegment';
import App from '../js/components/App';
import renderer from 'react-test-renderer';
import {mockDecryptedMessages, initialState} from './mocks/index';
import configureStore from 'redux-mock-store'
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {persistStore} from 'redux-persist'
import {Provider} from 'react-redux'

let store,container;
Enzyme.configure({ adapter: new Adapter() })

describe('App', () => {
  const mockStore = configureStore();
  beforeEach(()=>{
    store = mockStore(initialState)
    container = shallow(
      <App store={store}/>
    ).dive() 
  })

  it('Renders messages', () => {
    const component = renderer.create(
      <ChatSegment messages={mockDecryptedMessages} />,
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('Renders app', () => {
    expect(container.length).toEqual(1)
    const component = container.render();
    // let tree = component.toJSON();

    // expect(tree).toMatchSnapshot();
    // expect(container.find(Dropdown).length).toEqual(3)
  })
})

