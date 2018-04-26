import React, { Component } from 'react'
import { Segment, Form, TextArea, Container, Comment, Button } from 'semantic-ui-react'
import { Socket } from "phoenix"

class App extends Component {
  constructor() {
    super();
    this.state = { activeItem: 'home', messages: [] };
    this.handleMessage = this.handleMessage.bind(this);
    this.mainStyles = {
      flexDirection: 'column',
      height: '100%'
    }
    this.segmentStyles = {
      flex: '3 0 100%'
    }
    this.formStyles = {
      flex: '1',
      alignSelf: 'flex-end'
    }
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
    return (
      <div style={this.mainStyles}>
          <Segment raised style={this.segmentStyles}>
            <Comment.Group>
              {this.renderMessages()}
            </Comment.Group>
          </Segment>
          <Form style={this.formStyles}>
            <TextArea placeholder='Type your message' onKeyPress={this.handleMessage}  />
          </Form>
      </div> );
    }
  }

export default App;