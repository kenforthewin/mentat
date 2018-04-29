import React, { Component } from 'react';
import { Segment, Button } from 'semantic-ui-react'
import { Link } from 'react-router-dom';

class Home extends Component {
  constructor() {
    super();
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }

  render() {
    return (
      <div style={this.containerStyles}>
        <div style={{ alignSelf: 'flex-start' }} />
        <Segment style={this.segmentStyles}>
          <Button primary as={Link} to='/t/lobby'>Join Lobby</Button>
        </Segment>
        <div style={{ alignSelf: 'flex-end'  }} />
      </div>
    );
  }
}

export default Home;