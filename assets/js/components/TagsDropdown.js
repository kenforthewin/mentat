import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react'

export default class OnlineUsersDropdown extends Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <Dropdown multiple search selection closeOnChange options={this.props.dropdownOptions()} placeholder='Select a tag' value={this.props.tags} style={{ flex: 1, marginRight: '10px' }} onChange={this.props.updateTags}/>
    );
  }
}