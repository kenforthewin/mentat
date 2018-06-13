import React, {Component} from 'react';
import {Form, TextArea, Icon} from 'semantic-ui-react'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

export default class MessageForm extends Component {
  constructor(props) {
    super(props);
    this.state = { pickerVisible: false }

    this.maybeRenderPicker = this.maybeRenderPicker.bind(this);
    this.addEmoji = this.addEmoji.bind(this);
    this.togglePicker = this.togglePicker.bind(this);

    this.formStyles = {
      // flex: '0 1 auto',
      marginBottom: '30px',
      // display: 'flex', 
      // alignItems: 'center',
      // height: '100%',
      // minHeight: '2.71428571em'
    }
  }

  maybeRenderPicker() {
    // if (!this.state.pickerVisible) return;

    return (
      <Picker style={{display: this.state.pickerVisible ? 'block' : 'none', zIndex: 9999, position: 'absolute', bottom: '0px', right: '30px'}} onClick={this.addEmoji} />
    );
  }

  addEmoji(emoji) {
    this.props.textAreaNode.current.ref.value = this.props.textAreaNode.current.ref.value + emoji.native;
    this.props.textAreaNode.current.ref.focus();

    this.setState({
      ...this.state,
      pickerVisible: false
    })
  }

  togglePicker(e) {
    e.preventDefault();
    this.setState({
      ...this.state,
      pickerVisible: !this.state.pickerVisible
    })
  }

  render() {
    return (
      <Form style={this.formStyles}>
        <TextArea autoHeight rows={1}
          placeholder={"Enter your message"} 
          onKeyPress={this.props.handleMessage} 
          ref={this.props.textAreaNode}
          />
        <Icon name='plus' onClick={this.togglePicker} style={{position: 'absolute', bottom: '12px', right: '5px', fontSize: '20px', zIndex: '10000'}} />
        {this.maybeRenderPicker()}
      </Form>
    );
  }
}