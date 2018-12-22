import React, { Component } from 'react'
import { Modal, Header, Form, Button, Icon, Loader } from 'semantic-ui-react'

class SignUp extends Component {
  constructor(props) {
    super(props)
    this.emailRef = React.createRef();
    this.passwordRef = React.createRef();
  }
  componentDidMount() {
    if (!this.props.publicKey) {
      this.props.generateKey();
    }
  }

  render() {
    if (!this.props.publicKey) {
      return (
        <Modal basic open={true} closeOnDimmerClick={false} size='small'>
          <Loader content='Generating secure key...' />
        </Modal>
      )
    }
    return (
      <Modal basic closeOnDimmerClick={false} size='small' open>
        <Header content={this.props.actionName} />
        <Modal.Content>
          <Form>
            <Form.Field>
              <label style={{color: 'white'}}>Email</label>
              <input ref={this.emailRef}/>
            </Form.Field>
            <Form.Field >
              <label style={{color: 'white'}}>Password</label>
              <input type="password" ref={this.passwordRef}/>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' inverted onClick={() => this.props.action(this.emailRef.current.value, this.passwordRef.current.value)}>
            <Icon name='checkmark' />{this.props.actionName}
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

export default SignUp
