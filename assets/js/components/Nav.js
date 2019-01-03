import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Modal, Header, Dropdown, Button, Icon } from 'semantic-ui-react';
import TagsDropdown from './TagsDropdown'
import MainMenuDropdown from './MainMenuDropdown';
import OnlineUsersDropdown from './OnlineUsersDropdown';

export default class Nav extends Component {
  constructor(props) {
    super(props)
    this.renderLoggedInNav = this.renderLoggedInNav.bind(this)
    this.renderOnlineUsersDropdown = this.renderOnlineUsersDropdown.bind(this)
    this.renderTagsDropdown = this.renderTagsDropdown.bind(this)
    this.renderMainMenuDropdown = this.renderMainMenuDropdown.bind(this)

    this.state = {
      showModal: false
    }
  }

  renderLoggedInNav() {
    if (!this.props.loggedIn()) {
      return [
          <Link key={'sign-up'} to={'/sign-up'}>
            <Menu.Item content='Sign up'/>
          </Link>,
          <Link key={'sign-in'} to={'/sign-in'}>
            <Menu.Item content='Sign in'/>
          </Link>
      ]
    }
    // return <Menu.Item content='Sign out' onClick={this.props.burnBrowser} />
  }

  renderOnlineUsersDropdown() {
    if (this.props.navApp) {
      return (
        <Menu.Item>
        <OnlineUsersDropdown 
                      presences={this.props.presences} 
                      requests={this.props.requests} 
                      approveRequest={this.props.approveRequest} 
                      dismissRequest={this.props.dismissRequest}  />
        </Menu.Item>
      )
    }
  }

  renderTagsDropdown() {
    if (this.props.navApp) {
      return (
        <TagsDropdown 
          tags={this.props.tags}
          tagCounts={this.props.tagCounts}
          dropdownOptions={this.props.dropdownOptions}
          updateTags={this.props.updateTags}/>
      )
    }
  }

  renderMainMenuDropdown() {
    if (this.props.navApp) {
      return (
        <MainMenuDropdown
            changeName={this.props.changeName} 
            burnBrowser={this.props.burnBrowser}
            updateRoomSettings={this.props.updateRoomSettings}
            generateUrls={this.props.generateUrls} 
            currentName={this.props.currentName}
            roomUuid={this.props.roomUuid}  />
      )
    } else if (this.props.loggedIn()) {
      return (
        <Dropdown item icon='options' size='large' style={{flex: 0}}>
          <Dropdown.Menu>
            <Dropdown.Item text='Delete local storage' onClick={() => this.setState({...this.state, showModal: true})} />
          </Dropdown.Menu>
        </Dropdown>
      )
    }
  }

  render () {
    if (this.state.showModal) {
      return (
        <Modal basic open >
          <Header icon='archive' content='Delete local storage' />
          <Modal.Content>
            <p>
              Are you sure? This will permanently delete your keys and messages, revoking access to the room.
            </p>
          </Modal.Content>
          <Modal.Actions>
            <Button basic color='red' inverted onClick={() => this.setState({...this.state, showModal: false})}>
              <Icon name='remove' /> No
            </Button>
            <Button color='green' inverted onClick={() => { this.props.burnBrowser; this.setState({...this.state, showModal: false}) }} as={Link} to="/">
              <Icon name='checkmark' /> Yes
            </Button>
          </Modal.Actions>
        </Modal>
      );
    }

    return (
      <Menu attached='top' >
        <Link to={'/'}><Menu.Item header>Mentat</Menu.Item></Link>
        {this.renderOnlineUsersDropdown()}
        {this.renderTagsDropdown()}
        <Menu.Menu position='right'>
          {this.renderMainMenuDropdown()}
          {this.renderLoggedInNav()}
        </Menu.Menu>
      </Menu>
    )
  }
}
