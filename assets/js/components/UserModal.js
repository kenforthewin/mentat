import React, {Component} from 'react';
import {Modal,Header,Form,Button,Icon,Input,Ref,Image as SemanticImage} from 'semantic-ui-react'
import Pica from 'pica/dist/pica'
// const pica = new Pica();
import ColorPicker from './ColorPicker';

export default class MessageForm extends Component {
  constructor(props) {
    super(props);
    this.onImageChange = this.onImageChange.bind(this);
    this.imageInputRef = React.createRef();
    this.imageRef = React.createRef();
  }

  onImageChange(e, data) {
    const file = this.imageInputRef.current.files[0];
    if (file) {
      const reader = new FileReader();
      const img = document.createElement('img');
      img.onload = () => {
        const source = document.createElement('canvas');
        const dest = document.createElement('canvas');
        source.height = img.height;
        source.width = img.width;
        dest.width = "140";
        dest.height = "140";
        source.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        // pica.resize(source, dest)
        //   .then(result => pica.toBlob(result, 'image/jpeg', 0.90))
        //   .then(blob => {
        //     const objectURL = URL.createObjectURL(blob);
        //     this.imageRef.src = objectURL;

        //     this.props.encryptBlob(blob);
        //   })
      };

    reader.onload = ((aImg) => { return (e) => {
        img.src = e.target.result;
      }
    })(this.imageRef);


    reader.readAsDataURL(file);
    }
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
            <Form.Field inline>
              <Ref innerRef={(ref) => this.imageRef = ref} >
                <SemanticImage inline />
              </Ref>
              <input type="file" onChange={this.onImageChange} accept="image/*" ref={this.imageInputRef}/>
            </Form.Field>
            <input type="text" style={{ display: 'none' }} ref={this.props.avatarInput} />
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