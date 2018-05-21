import React, {Component} from 'react';
import {Modal,Header,Form,Button,Icon} from 'semantic-ui-react'
import ColorPicker from './ColorPicker';

export default class MessageForm extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Modal basic open={this.props.modalOpen} closeOnDimmerClick={false} size='small'>
        <Header icon='user circle' content='Set name and preferred color' />
        <Modal.Content>
          <Form>
            <Form.Field>
              <input placeholder='Username' defaultValue={this.props.name} ref={this.props.nameInput}/>
            </Form.Field>
            <ColorPicker color={this.props.color} inputRef={this.props.colorInput}/>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' onClick={this.props.onModalClose} inverted>
            <Icon name='checkmark' /> Accept
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}