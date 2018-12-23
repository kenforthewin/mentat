import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Route,
  Link,
  Redirect
} from 'react-router-dom';
import { ConnectedRouter as Router } from 'react-router-redux';
import { Menu, Container, Modal, Header, Button, Icon } from 'semantic-ui-react';
import App from './App';
import Home from './Home';
import { Socket, Presence } from "phoenix"
import { approveRequest, burnBrowser } from '../actions/cryptoActions'
import {persistor} from '../reducers/index';

let openpgp =  require('openpgp');

class Main extends Component {
  constructor() {
    super();
    this.state = { activeItem: 'home', userRequests: [], hasKeys: true };
    this.handleItemClick = this.handleItemClick.bind(this);
    this.joinUserChannel = this.joinUserChannel.bind(this)
    this.approveUserRequest = this.approveUserRequest.bind(this)
    this.rejectUserRequest = this.rejectUserRequest.bind(this)
    this.pgpWorkerStarted = openpgp.initWorker({ path:'/js/openpgp.worker.min.js' })
  }

  componentDidMount() {
    if (this.props.userReducer.token) {
      this.joinUserChannel();
    } else {
      this.props.burnBrowser();
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
    this.channel.on("approve_user_request", payload => {
      if (payload.public_key === this.props.cryptoReducer.publicKey) {
        this.props.approveRequest(payload.new_public_key, payload.encrypted_private_key, payload.encrypted_passphrase, payload.requests);
        this.setState({hasKeys: true})
      }
    })
    this.channel.on('user_request', (payload) => {
      if (payload.public_key !== this.props.cryptoReducer.publicKey) {
        this.setState({ userRequests: [...this.state.userRequests, {public_key: payload.public_key}] })
      }
    })
    this.channel.join()
      .receive("ok", resp => {
        this.setState({hasKeys: resp.has_keys})
        if (!resp.has_keys && resp.encrypted_private_key) {
          this.props.approveRequest(resp.public_key, resp.encrypted_private_key, resp.encrypted_passphrase, resp.requests);
        } else if (resp.has_keys) {
          this.setState({ userRequests: resp.user_requests.user_requests })
        }
      })
  }

  handleItemClick(e, { name }) { this.setState({ activeItem: name }); }
  
  async approveUserRequest(publicKey) {
    const privateKeyOptions = {
      data: this.props.cryptoReducer.privateKey,
      publicKeys: openpgp.key.readArmored(publicKey).keys
    };
    const encryptedPrivateKeyData = await openpgp.encrypt(privateKeyOptions)
    const encryptedPrivateKey = encryptedPrivateKeyData.data
    const passphraseOptions = {
      data: this.props.cryptoReducer.passphrase,
      publicKeys: openpgp.key.readArmored(publicKey).keys
    };
    const encryptedPassphraseData = await openpgp.encrypt(passphraseOptions)
    const encryptedPassphrase = encryptedPassphraseData.data
    this.channel.push("approve_user_request", {
      publicKey,
      encryptedPrivateKey,
      encryptedPassphrase
    })
    this.setState({ userRequests: this.state.userRequests.filter((e) => e.public_key !== publicKey) })
  }

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

  rejectUserRequest(publicKey) {
    this.channel.push("reject_user_request", { publicKey })
    this.setState({ userRequests: this.state.userRequests.filter((e) => e.public_key !== publicKey) })
  }

  render() {
    if (!this.state.hasKeys) {
      return (
        <Modal basic open={true} closeOnDimmerClick={false} size='small'>
          <Header icon='user circle' content="Waiting for two-factor approval." />
        </Modal>
      )
    } else if (this.state.userRequests.length > 0) {
      return (
        <Modal basic open={true} closeOnDimmerClick={false} size='small'>
          <Header icon='user circle' content="Approve two-factor request?" />
          <Modal.Actions>
            <Button color='green' onClick={() => this.approveUserRequest(this.state.userRequests[0].public_key)} inverted>
              <Icon name='checkmark' /> Accept
            </Button>
            <Button color='red' inverted  onClick={() => this.rejectUserRequest(this.state.userRequests[0].public_key)}>
              <Icon name='remove'/> Reject
            </Button>
        </Modal.Actions>
        </Modal>
      )
    }
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
const mapDispatchToProps = (dispatch) => {
  return {
    burnBrowser: () => persistor.purge() && dispatch(burnBrowser()),
    approveRequest: (publicKey, encryptedPrivateKey, encryptedPassphrase, requests) => dispatch(approveRequest(publicKey, encryptedPrivateKey, encryptedPassphrase, requests))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);
