import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Route,
  Link,
  Redirect
} from 'react-router-dom';
import { ConnectedRouter as Router } from 'react-router-redux';
import { Menu, Container } from 'semantic-ui-react';
import App from './App';

class Main extends Component {
  constructor() {
    super();
    this.state = { activeItem: 'home' };
    this.handleItemClick = this.handleItemClick.bind(this);
  }

  handleItemClick(e, { name }) { this.setState({ activeItem: name }); }

  renderNav() {
    const { activeItem } = this.state;

    return (
      <Menu pointing secondary>
        <Menu.Item name='home' active={activeItem === 'home'} onClick={this.handleItemClick} />
        <Menu.Item name='notha' active={activeItem === 'notha'} onClick={this.handleItemClick} />
        <Menu.Menu position='right'>
          {/* <Menu.Item name='logout' active={activeItem === 'logout'} onClick={this.handleItemClick} /> */}
        </Menu.Menu>
      </Menu>
    )
  }

  render() {
    return (
      <Router history={this.props.history} >
        <div style={{ height: '100%' }}>
          {/* {this.renderNav()} */}
          <br />
          <Container style={{ height: '100%' }}>
            <Route
              exact
              path="/"
              component={App} />
          </Container>
        </div>
      </Router>
    );
  }
}

export default Main;