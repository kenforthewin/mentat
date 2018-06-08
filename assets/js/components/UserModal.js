import React, {Component} from 'react';
import {Modal,Header,Form,Button,Icon,Input,Ref,Image as SemanticImage} from 'semantic-ui-react'
import Pica from 'pica/dist/pica'
const pica = new Pica();
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css';
import ColorPicker from './ColorPicker';

export default class MessageForm extends Component {
  constructor(props) {
    super(props);
    this.onImageChange = this.onImageChange.bind(this);
    this.resizeImage = this.resizeImage.bind(this);
    this.maybeRenderAvatar = this.maybeRenderAvatar.bind(this);
    this.imageInputRef = React.createRef();
    this.imageRef = React.createRef();
  }

  onImageChange(e, data) {
    const file = this.imageInputRef.current.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ((aImg) => { return (e) => {
          this.imageRef.src = e.target.result;
          this.cropper = new Cropper(this.imageRef, {
            aspectRatio: 1
          });
        }
      })(this.imageRef);
      reader.readAsDataURL(file);
    }
  }

  resizeImage() {
    if (this.cropper) {
        const source = this.cropper.getCroppedCanvas();
        const dest = document.createElement('canvas');
        dest.width = "140";
        dest.height = "140";
        pica.resize(source, dest)
          .then(result => pica.toBlob(result, 'image/jpeg', 0.90))
          .then(blob => {
            const objectURL = URL.createObjectURL(blob);
            this.imageRef.src = objectURL;
            this.props.encryptBlob(blob);
          })
    } else {
      this.props.onModalClose();
    }
  }

  maybeRenderAvatar() {
    if (this.props.showAvatar) {
      return (
        <div>
          <Form.Field inline>
            <Ref innerRef={(ref) => this.imageRef = ref} >
              <SemanticImage size='small' />
            </Ref>
          </Form.Field>
          <input type="file" onChange={this.onImageChange} accept="image/*" ref={this.imageInputRef}/>
        </div>
      )
    }

    return null;
  }

  render() {
    return (
      <Modal basic open={this.props.modalOpen} closeOnDimmerClick={false} size='small'>
        <Header icon='user circle' content='Set name, color, and avatar' />
        <Modal.Content>
          <Form>
            <Form.Field>
              <input placeholder='Username' defaultValue={this.props.name} ref={this.props.nameInput}/>
            </Form.Field>
            <ColorPicker color={this.props.color} inputRef={this.props.colorInput}/>
            {this.maybeRenderAvatar()}
            {/* <input type="text" style={{ display: 'none' }} ref={this.props.avatarInput} /> */}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' onClick={this.resizeImage} inverted>
            <Icon name='checkmark' /> Accept
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}