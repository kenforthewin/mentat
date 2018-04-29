import React, { Component } from 'react'
import { Sidebar, Segment, Button, Menu, Image, Header, Icon, Rail, Ref } from 'semantic-ui-react'

class SidebarLeftOverlay extends Component {
  constructor() {
    super()
    this.state = { visible: false };
    this.toggleVisibility = this.toggleVisibility.bind(this);
    this.railStyle = this.railStyle.bind(this);
    this.handleRef = this.handleRef.bind(this);
    this.handleRailRef = this.handleRailRef.bind(this);
  }

  toggleVisibility() {
    this.setState({ visible: !this.state.visible });
  }

  railStyle() {
    if (this.state.visible) {
      return({
        paddingLeft: '150px'
      });
    }
    return({});
  }

  handleRef(node) {
    this.setState({node});
  }

  handleRailRef(railNode) {
    this.setState({railNode});
  }

  render() {
    const { visible } = this.state
    return (
      <div>
        <Ref innerRef={this.handleRailRef}>
          <Rail attached internal position='left' style={this.railStyle()} onClick={this.toggleVisibility}>
            <Icon name='content' size='large'/>
          </Rail>
        </Ref>
        <Ref innerRef={this.handleRef}>
          <Sidebar as={Menu} animation='overlay' width='thin' visible={visible} vertical inverted >
            <Menu.Item name='home'>
              Home
            </Menu.Item>
            <Menu.Item name='gamepad'>
              Games
            </Menu.Item>
            <Menu.Item name='camera'>
              Channels
            </Menu.Item>
          </Sidebar>
        </Ref>
      </div>
    )
  }
}

export default SidebarLeftOverlay