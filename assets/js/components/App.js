import React, { Component } from 'react'
import { Menu, Segment, Form, TextArea, Container, Comment, Button } from 'semantic-ui-react'
import { Socket } from "phoenix"

class App extends Component {
  constructor() {
    super();
    this.state = { activeItem: 'home', messages: [] };
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  componentDidMount() {
    let socket = new Socket("/socket", {params: {token: window.userToken}});
    socket.connect();

    this.channel = socket.channel("room:lobby", {});

    this.channel.on("new_msg", payload => {
      this.setState({
        ...this.state,
        messages: [
          ...this.state.messages,
          { name: payload.name, text: payload.text }
        ]
      });
    });

    this.channel.join()
      .receive("ok", resp => { console.log("Joined successfully", resp) })
      .receive("error", resp => { console.log("Unable to join", resp) });
  }

  handleItemClick(e, { name }) { this.setState({ activeItem: name }); }

  renderMessage(name, text, i=0, avatar='/images/matt.jpg') {
    return (
      <Comment key={i}>
        <Comment.Avatar src={avatar} />
        <Comment.Content>
          <Comment.Author as='a'>{name}</Comment.Author>
          <Comment.Text>{text}</Comment.Text>
        </Comment.Content>
      </Comment>
    );
  }

  renderMessages() {
    const { messages } = this.state;

    return messages.map((message, i) => {
      return this.renderMessage(message.name, message.text, i);
    });
  }

  handleMessage(e) {
    if (e.key === "Enter") {
      this.channel.push("new_msg", {text: e.target.value, name: 'Matt'});
      e.target.value = '';
    }
  }

  render() {
    const { activeItem } = this.state;

    return (
      <div>
        <Menu pointing secondary>
          <Menu.Item name='home' active={activeItem === 'home'} onClick={this.handleItemClick} />
          <Menu.Item name='notha' active={activeItem === 'notha'} onClick={this.handleItemClick} />
          <Menu.Menu position='right'>
            {/* <Menu.Item name='logout' active={activeItem === 'logout'} onClick={this.handleItemClick} /> */}
          </Menu.Menu>
        </Menu>
        <Container>
          <Comment.Group>
            {this.renderMessages()}
          </Comment.Group>
          <Form>
            <TextArea placeholder='Type your message' onKeyPress={this.handleMessage}  />
          </Form>
        </Container>
      </div> );
    }
  }

export default App;