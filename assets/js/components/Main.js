import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Route,
  Link,
  Redirect
} from 'react-router-dom';
import { ConnectedRouter as Router } from 'react-router-redux';
import { Menu, Container, Modal, Header, Button, Icon, Segment, Sidebar } from 'semantic-ui-react';
import App from './App';
import Home from './Home';
import { Socket, Presence } from "phoenix"
import { approveRequest, burnBrowser, receiveGroupKeypair } from '../actions/cryptoActions'
import {persistor} from '../reducers/index';
import SignUp from './SignUp'
import { signUp, signIn } from '../actions/userActions'
import { generateKeypair } from '../actions/cryptoActions'
import Nav from './Nav'

let openpgp =  require('openpgp');

class Main extends Component {
  constructor() {
    super();
    this.state = { activeItem: 'home', userRequests: [], hasKeys: true };
    this.handleItemClick = this.handleItemClick.bind(this);
    this.joinUserChannel = this.joinUserChannel.bind(this)
    this.approveUserRequest = this.approveUserRequest.bind(this)
    this.rejectUserRequest = this.rejectUserRequest.bind(this)
    this.loggedIn = this.loggedIn.bind(this)
    this.navApp = this.navApp.bind(this)
    this.maybeRenderNav = this.maybeRenderNav.bind(this)
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
        console.log(resp)
        this.setState({hasKeys: resp.has_keys})
        if (!resp.has_keys && resp.encrypted_private_key) {
          this.props.approveRequest(resp.public_key, resp.encrypted_private_key, resp.encrypted_passphrase, resp.requests);
        } else if (resp.has_keys) {
          this.setState({ userRequests: resp.user_requests.user_requests })
          resp.requests.requests.forEach((request) => {
            if (!this.props.cryptoReducer.groups[request.name]) {
              this.props.receiveGroupKeypair(request.team_name, request.team_public_key, request.encrypted_team_private_key, [], request.team_nickname)
            }
          })
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

  rejectUserRequest(publicKey) {
    this.channel.push("reject_user_request", { publicKey })
    this.setState({ userRequests: this.state.userRequests.filter((e) => e.public_key !== publicKey) })
  }

  loggedIn() {
    return !!this.props.userReducer.token
  }

  navApp() {
    return this.props.routerReducer.location && this.props.routerReducer.location.pathname.startsWith('/t/');
  }

  maybeRenderNav() {
    if (!this.navApp()) {
      return (
        <Nav loggedIn={this.loggedIn} navApp={false} burnBrowser={this.props.burnBrowser} />
      )
    }
  }

  render() {
    if (!this.state.hasKeys) {
      return (
        <Modal basic open={true} closeOnDimmerClick={false} size='small'>
          <Header icon='user circle' content="Waiting for two-factor approval." />
            <Modal.Actions>
              <Button inverted color='red' content='Sign out' onClick={() => { this.setState({hasKeys: true}); this.props.burnBrowser() }}/>
            </Modal.Actions>
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
          {this.maybeRenderNav()}
          <Route
            exact
            path="/"
            component={Home} />
          <Route
            exact
            path="/t/:room"
            component={App} />
          <Route
            exact
            path='/sign-up'
            render={ () =>
              <SignUp signedIn={this.loggedIn()} errors={this.props.userReducer.authErrors} action={this.props.signUp} actionName={'Sign up'} publicKey={this.props.cryptoReducer.publicKey} generateKey={this.props.generateKeypair}/>
            } />
          <Route
            exact
            path='/sign-in'
            render={ () =>
              <SignUp errors={this.props.userReducer.authErrors} signedIn={this.loggedIn()} action={this.props.signIn} actionName={'Sign in'}  publicKey={this.props.cryptoReducer.publicKey}  generateKey={this.props.generateKeypair}/>
            } />
        </div>
      </Router>
    );
  }
}
const mapStateToProps = (state) => {
  const {cryptoReducer, userReducer, routerReducer} = state;
  return {cryptoReducer, userReducer, routerReducer};
}
const mapDispatchToProps = (dispatch) => {
  return {
    burnBrowser: () => persistor.purge() && dispatch(burnBrowser()),
    approveRequest: (publicKey, encryptedPrivateKey, encryptedPassphrase, requests) => dispatch(approveRequest(publicKey, encryptedPrivateKey, encryptedPassphrase, requests)),
    signIn: (email, password) => dispatch(signIn(email, password)),
    signUp: (email, password) => dispatch(signUp(email, password)),
    generateKeypair: () => dispatch(generateKeypair()),
    receiveGroupKeypair: (room, publicKey, encryptedPrivateKey, users = [], name = '') => dispatch(receiveGroupKeypair(room, publicKey, encryptedPrivateKey, users, name))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);
