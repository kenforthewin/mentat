import React, {Component} from 'react';
import {Form, TextArea} from 'semantic-ui-react'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'
import emoji from 'node-emoji';

export default class MessageForm extends Component {
  constructor(props) {
    super(props);
    this.state = { pickerVisible: false }
    this.textAreaNode = React.createRef();

    this.maybeRenderPicker = this.maybeRenderPicker.bind(this);
    this.addEmoji = this.addEmoji.bind(this);
    this.togglePicker = this.togglePicker.bind(this);

    this.formStyles = {
      flex: '0',
      marginBottom: '30px',
      // display: 'flex', 
      // alignItems: 'center',
      height: '100%',
      minHeight: '2.71428571em'
    }
  }
  maybeRenderPicker() {
    // if (!this.state.pickerVisible) return;

    return (
      <Picker style={{display: this.state.pickerVisible ? 'block' : 'none', zIndex: 9999, position: 'absolute', bottom: '0px', right: '30px'}} onClick={this.addEmoji} />
    );
  }

  addEmoji(emoji) {
    this.textAreaNode.current.ref.value = this.textAreaNode.current.ref.value + emoji.colons;
    this.textAreaNode.current.ref.focus();

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
        <TextArea rows={1}
          placeholder={this.props.textPlaceholder()} 
          onKeyPress={this.props.handleMessage} 
          disabled={this.props.areTagsEmpty()}
          ref={this.textAreaNode}
          />
        <a href="#" onClick={this.togglePicker} style={{position: 'absolute', bottom: '5px', right: '5px', fontSize: '20px', zIndex: '10000', opacity: 0.75 }}>{emoji.emojify(":slightly_smiling_face:")}</a>
        {this.maybeRenderPicker()}
      </Form>
    );
  }
}