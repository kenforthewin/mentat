import React, { Component } from 'react';
import { Segment, Button, Header, Input, Icon } from 'semantic-ui-react'
import { Link, Redirect } from 'react-router-dom';
import uuidv1 from 'uuid/v1';
import { connect } from 'react-redux';

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {buttonsDisabled: false, groupReady: false}

    this.generateGroup = this.generateGroup.bind(this);
    this.redirectToGroup = this.redirectToGroup.bind(this);

    this.inputGroupRef = React.createRef();

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

  render() {
    if (this.state.groupReady) {
      return (
        <Redirect to={`/t/${this.state.groupUuid}`} push />
      )
    }
    return (
      <div style={this.containerStyles}>
        <div style={{ alignSelf: 'flex-start' }} />
        <div style={this.segmentStyles}>
          {/* <Button disabled={this.state.buttonsDisabled} primary fluid as={Link} to='/t/lobby'>Join Lobby</Button> */}
          {this.renderRecents()}
          <Segment>
            <Header>Enter room code</Header>
            <Input disabled={this.state.buttonsDisabled} icon={<Icon name='arrow right' inverted circular link onClick={this.redirectToGroup} />} fluid ref={ref => this.inputGroupRef = ref} />
          </Segment>
          <Segment>
            <Header>Create a new room</Header>
            <Button primary disabled={this.state.buttonsDisabled} fluid onClick={this.generateGroup}>Create room</Button>
          </Segment>
        </div>
        <div style={{ alignSelf: 'flex-end'  }} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const {cryptoReducer} = state;
  return {cryptoReducer};
}

export default connect(mapStateToProps, {})(Home);