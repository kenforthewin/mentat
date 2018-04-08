import React, { Component } from 'react'
import { Menu, Segment } from 'semantic-ui-react'

class App extends Component {
  constructor() {
    super()
    this.state = { activeItem: 'home' }
    this.handleItemClick = this.handleItemClick.bind(this)
  }

  handleItemClick(e, { name }) { this.setState({ activeItem: name }) }

  render() {
    const { activeItem } = this.state

  return (
    <Menu pointing secondary>
            <Menu.Item name='home' active={activeItem === 'home'} onClick={this.handleItemClick} />
            <Menu.Item name='notha' active={activeItem === 'notha'} onClick={this.handleItemClick} />
            <Menu.Menu position='right'>
              {/* <Menu.Item name='logout' active={activeItem === 'logout'} onClick={this.handleItemClick} /> */}
            </Menu.Menu>
    </Menu> )
  }
}

export default App;