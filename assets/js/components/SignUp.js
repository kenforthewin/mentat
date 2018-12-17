import React, { Component } from 'react'
import { Modal, Header, Form, Button, Icon } from 'semantic-ui-react'
import { signUp } from '../actions/userActions'
import { connect } from 'react-redux'

class SignUp extends Component {
  render() {
    return (
      <Modal basic closeOnDimmerClick={false} size='small' open>
        <Header content='Sign up' />
        <Modal.Content>
          <Form>
            <Form.Field>
              <label >Email</label>
              <input ref={this.emailRef}/>
            </Form.Field>
            <Form.Field >
              <label >Password</label>
              <input type="password" ref={this.passwordRef}/>
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' inverted>
            <Icon name='checkmark' onClick={() => this.props.signUp(this.emailRef.current.value, this.passwordRef.current.value)}/> Sign up
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
    signUp: () => dispatch(signUp(email, password))
  }
}

export default connect(null, mapDispatchToProps)(SignUp)
