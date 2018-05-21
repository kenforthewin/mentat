import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react'
import { Link } from 'react-router-dom';

export default class MainMenuDropdown extends Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <Dropdown icon='options' size='large' style={{flex: 0}} direction='left'>
        <Dropdown.Menu>
          <Dropdown.Item text='Change name' onClick={this.props.changeName}/>
          <Dropdown.Divider />
          <Dropdown.Item text='Exit to main menu' as={Link} to='/' />
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}