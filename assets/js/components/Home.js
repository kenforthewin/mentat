import React, { Component } from 'react';
import { Segment, Button, Header, Input, Icon, Form, Modal, Checkbox } from 'semantic-ui-react'
import { Link, Redirect } from 'react-router-dom';
import uuidv1 from 'uuid/v1';
import { connect } from 'react-redux';
import SignUp from './SignUp'
import { signUp, signIn } from '../actions/userActions'
import { generateKeypair } from '../actions/cryptoActions'

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {buttonsDisabled: false, groupReady: false, groupForm: false, signUp: false, signIn: false}

    this.generateGroup = this.generateGroup.bind(this);
    this.redirectToGroup = this.redirectToGroup.bind(this);
    this.renderRecents = this.renderRecents.bind(this)

    this.inputGroupRef = React.createRef();
    this.nameInput = React.createRef();
    this.containerStyles = {
      display: 'flex',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center'
    }

    this.segmentStyles = {
      flex: '1'
    }
  }

  generateGroup() {
    this.setState({...this.state, buttonsDisabled: true})

    const group_uuid = uuidv1();

    fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.userReducer.token}`
      },
      body: JSON.stringify({
        uuid: group_uuid,
        name: this.nameInput.current.value
      })
    }).then((response) => {
      return response.json();
    }).then((response) => {
      this.setState({
        groupReady: true,
        groupForm: false,
        groupUuid: response.uuid
      })
    })
  }

  redirectToGroup() {
    this.setState({
      groupReady: true,
      groupUuid: this.inputGroupRef.inputRef.value
    })
  }

  redirectNamedGroup(name) {
    this.inputGroupRef.inputRef.value = name;
    this.redirectToGroup();
  }

  renderRecents() {
    const groups = this.props.cryptoReducer.groups;
    if (Object.keys(groups).length < 1) {
      return null;
    }
    console.log(Object.keys(groups))
    const recents = Object.keys(groups).map((group, i) => {
      return (<Button style={{marginBottom: '10px'}} key={i} basic disabled={this.state.buttonsDisabled} fluid onClick={() => this.redirectNamedGroup(group)}>{groups[group].nickname || group}</Button>);
    });
    return (
      <Segment >
        <Header>Recent rooms</Header>
        {recents}
      </Segment>
    )
  }

  renderGroupModal() {
    return (
      <Modal basic open={true} closeOnDimmerClick={false} size='small'>
        <Modal.Content>
          <Form>
            <Form.Field>
              <input placeholder='Group name' ref={this.nameInput}/>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' onClick={this.generateGroup} inverted>
            <Icon name='checkmark'/> Accept
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }

  render() {
    if (this.state.groupReady) {
      return (
        <Redirect to={`/t/${this.state.groupUuid}`} push />
      )
    } else if (this.state.groupForm) {
      return this.renderGroupModal()
    } else if (this.state.signUp && !this.props.userReducer.token) {
      return (
        <SignUp action={this.props.signUp} actionName={'Sign up'} publicKey={this.props.cryptoReducer.publicKey} generateKey={this.props.generateKeypair}/>
      )
    } else if (this.state.signIn && !this.props.userReducer.token) {
      return (
        <SignUp action={this.props.signIn} actionName={'Sign in'}  publicKey={this.props.cryptoReducer.publicKey}  generateKey={this.props.generateKeypair}/>
      )
    }
    return (
      <div style={this.containerStyles}>
        <div style={{ alignSelf: 'flex-start' }} />
        <div style={this.segmentStyles}>
          {/* <Button disabled={this.state.buttonsDisabled} primary fluid as={Link} to='/t/lobby'>Join Lobby</Button> */}
          <Segment>
            <Button onClick={() => this.setState({ signUp: true })}>Sign up</Button>
            <Button onClick={() => this.setState({ signIn: true })}>Sign in</Button>
          </Segment>
          {this.renderRecents()}
          <Segment>
            <Header>Enter room code</Header>
            <Input disabled={this.state.buttonsDisabled} icon={<Icon name='arrow right' inverted circular link onClick={this.redirectToGroup} />} fluid ref={ref => this.inputGroupRef = ref} />
          </Segment>
          <Segment>
            <Header>Create a new room</Header>
            <Button primary disabled={this.state.buttonsDisabled} fluid onClick={() => this.setState({ groupForm: true })}>Create room</Button>
          </Segment>
        </div>
        <div style={{ alignSelf: 'flex-end'  }} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const {cryptoReducer, userReducer} = state;
  return {cryptoReducer, userReducer};
}

const mapDispatchToProps = (dispatch) => {
  return {
    signUp: (email, password) => dispatch(signUp(email, password)),
    signIn: (email, password) => dispatch(signIn(email, password)),
    generateKeypair: () => dispatch(generateKeypair())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);