import React, {Component} from 'react';
import {Dropdown, Form, Item, Button} from 'semantic-ui-react'

export default class OnlineUsersDropdown extends Component {
  constructor(props) {
    super(props);
    this.renderOnlineUsers = this.renderOnlineUsers.bind(this);

  }

  renderOnlineUsers() {
    const users = this.props.presences;

    return Object.values(users).map((u, i) => {
      const metas = u.metas[0]
      return (
        <Dropdown.Item label={{ empty: true, circular: true, style: {backgroundColor: metas.color} }} text={metas.name} key={i} />
      )
    })
  }

  renderRequests() {
    const requests = this.props.requests;

    return Object.values(requests).map((r, i) => {
      return (
        <Dropdown.Item key={i} >
          <Form size='mini'>
            <Form.Group inline>
              <Item content={r.name} style={{ marginRight: '10px' }}/>
              <Button size='mini' onClick={this.props.approveRequest} data-uuid={r.uuid} data-public-key={r.publicKey} compact>Yes</Button>
              <Button size='mini' onClick={this.props.dismissRequest} data-uuid={r.uuid} compact>No</Button>
            </Form.Group>
          </Form>
        </Dropdown.Item>
      );
    });
  }

  render() {
    return (
    <Dropdown icon='users' size='large' style={{flex: 0, marginRight: '10px'}} direction='right'>
      <Dropdown.Menu>
        <Dropdown.Header content='Online Now' />
        <Dropdown.Divider />
        {this.renderOnlineUsers()}
        <Dropdown.Header content='Requests' />
        <Dropdown.Divider />
        {this.renderRequests()}
      </Dropdown.Menu>
    </Dropdown>
    );
  }
}