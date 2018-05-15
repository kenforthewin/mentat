import React, { Component } from 'react';
import { Segment, Button, Divider } from 'semantic-ui-react'
import { Link, Redirect } from 'react-router-dom';
import uuidv1 from 'uuid/v1';

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {buttonsDisabled: false, groupReady: false}

    this.generateGroup = this.generateGroup.bind(this);

    this.containerStyles = {
      display: 'flex',
      height: '100%',
      // flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }

    this.segmentStyles = {
      // maxWidth: '50%',
      flex: '1',
      // display: 'flex',
      // alignItems: 'center',
      // justifyContent: 'center'
    }
  }

  generateGroup() {
    this.setState({...this.state, buttonsDisabled: true})

    const group_uuid = uuidv1();

    fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uuid: group_uuid
      })
    }).then((response) => {
      return response.json();
    }).then((response) => {
      this.setState({
        groupReady: true,
        groupUuid: response.uuid
      })
    })
  }

  render() {
    if (this.state.groupReady) {
      return (
        <Redirect to={`/t/${this.state.groupUuid}`} />
      )
    }
    return (
      <div style={this.containerStyles}>
        <div style={{ alignSelf: 'flex-start' }} />
        <Segment style={this.segmentStyles}>
          <Button disabled={this.state.buttonsDisabled} primary fluid as={Link} to='/t/lobby'>Join Lobby</Button>
          <Divider horizontal>Or</Divider>
          <Button secondary disabled={this.state.buttonsDisabled} fluid onClick={this.generateGroup}>Create a new group</Button>
        </Segment>
        <div style={{ alignSelf: 'flex-end'  }} />
      </div>
    );
  }
}

export default Home;