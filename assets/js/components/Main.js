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
import Home from './Home';
import { Socket, Presence } from "phoenix"

class Main extends Component {
  constructor() {
    super();
    this.state = { activeItem: 'home' };
    this.handleItemClick = this.handleItemClick.bind(this);
    this.joinUserChannel = this.joinUserChannel.bind(this)
  }

  componentDidMount() {
    if (this.props.userReducer.token) {
      this.joinUserChannel();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.userReducer.token && !prevProps.userReducer.token) {
      this.joinUserChannel();
    }
  }

  joinUserChannel() {
    let socket = new Socket("/socket", {params: {token: this.props.userReducer.token}});
    socket.connect();
    this.channel = socket.channel(`user:${this.props.userReducer.uuid}`, {publicKey: this.props.cryptoReducer.publicKey});
    this.channel.join()
      .receive("ok", resp => {
        console.log(resp)
      })
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
              component={Home} />
            <Route
              exact
              path="/t/:room"
              component={App} />
          </Container>
        </div>
      </Router>
    );
  }
}
const mapStateToProps = (state) => {
  const {cryptoReducer, userReducer} = state;
  return {cryptoReducer, userReducer};
}

export default connect(mapStateToProps, {})(Main);
