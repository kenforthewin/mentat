import React, { Component } from 'react'
import { Segment, Form, TextArea, Container, Comment, Button, Rail, Icon, Dropdown } from 'semantic-ui-react'
import { Socket } from "phoenix"
import moment from 'moment'
import ChatSegment from './ChatSegment';
import SidebarLeftOverlay from './SidebarLeftOverlay';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { messages: [], tags: ['general'], tagOptions: ['general', 'random'] };
    this.handleMessage = this.handleMessage.bind(this);
    this.initializeMessages = this.initializeMessages.bind(this);
    this.updateTags = this.updateTags.bind(this);
    this.areTagsEmpty = this.areTagsEmpty.bind(this);
    this.textPlaceholder = this.textPlaceholder.bind(this);
    this.dropdownOptions = this.dropdownOptions.bind(this);
    this.getTags = this.getTags.bind(this);

    this.room = props.match.params.room

    this.mainStyles = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
    this.formStyles = {
      flex: '0',
      paddingBottom: '30px'
    }
  }

  componentDidMount() {
    let socket = new Socket("/socket", {params: {token: window.userToken}});
    socket.connect();
    this.channel = socket.channel(`room:${this.room}`, {tags: this.state.tags});

    this.channel.on("new_msg", payload => {
      this.setState({
        ...this.state,
        messages: [
          ...this.state.messages,
          { name: payload.name, text: payload.text, timestamp: moment().format(), tags: payload.tags }
        ]
      });
    });

    this.channel.on("new_tags", payload => {
      this.initializeMessages(payload.messages.reverse());
    })

    this.channel.on("get_tags", payload => {
      this.setState({
        ...this.state,
        tagOptions: payload.tags.map(t => t.name)
      })
    })

    this.channel.join()
      .receive("ok", resp => { this.initializeMessages(resp.messages.messages.reverse()); this.getTags(resp.tags.tags) })
      .receive("error", resp => { console.log("Unable to join", resp) });
  }

  getTags(tags) {
    this.setState({
      ...this.state,
      tagOptions: tags.map(t => t.name)
    })
  }

  initializeMessages(messages) {
    this.setState({
      ...this.state,
      messages: messages.map((m) => { return {name: 'Matt', text: m.body, timestamp: m.inserted_at, tags: m.tags.map(t => t.name)} })
    });
  }

  handleMessage(e) {
    if (e.key === "Enter") {
      e.preventDefault()

      if(e.target.value.length > 0 && this.state.tags.length > 0) {
        this.channel.push("new_msg", {text: e.target.value, name: 'Matt', tags: this.state.tags, room: this.room});
        e.target.value = null;
      }
    } else if ((e.key === "Spacebar" || e.key === " ") && e.target.value && e.target.value[0] === '#') {
      e.preventDefault();
      const newTag = e.target.value.slice(1);
      e.target.value = null;
      const newTags = this.state.tags.includes(newTag) ? this.state.tags : [
        ...this.state.tags,
        newTag
      ];
      const newPossibleTags = this.state.tagOptions.includes(newTag) ? this.state.tagOptions : [
        ...this.state.tagOptions,
        newTag
      ];
      this.setState({
        ...this.state,
        tags: newTags,
        tagOptions: newPossibleTags
      });
      this.channel.push("new_tags", {tags: newTags, room: this.room});
    }
  }

  updateTags(e, data) {
    this.setState({
      ...this.state,
      tags: data.value
    });
    this.channel.push("new_tags", {tags: data.value, room: this.room});
  }

  areTagsEmpty() {
    return this.state.tags.length === 0;
  }

  textPlaceholder() {
    if (this.areTagsEmpty()) {
      return 'Select a tag';
    }
    return 'Type your message';
  }

  dropdownOptions() {
    return this.state.tagOptions.map(t => { return({text: t, value: t});});
  }

  render() {
    return (
      <div style={this.mainStyles}>
        <SidebarLeftOverlay />
        <Dropdown multiple search selection closeOnChange options={this.dropdownOptions()} placeholder='' value={this.state.tags} style={{ flex: 0 }} onChange={this.updateTags}/>
        <ChatSegment messages={this.state.messages}/>
        <Form style={this.formStyles}>
          <TextArea autoHeight rows={1} placeholder={this.textPlaceholder()} onKeyPress={this.handleMessage} disabled={this.areTagsEmpty()} />
        </Form>
      </div> );
    }
  }

export default App;