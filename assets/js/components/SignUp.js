import React, { Component } from 'react'
import { Modal, Header, Form, Button, Icon, Loader, Segment, Container, Message } from 'semantic-ui-react'
import { Redirect, Link } from 'react-router-dom';

class SignUp extends Component {
  constructor(props) {
    super(props)
    this.emailRef = React.createRef();
    this.passwordRef = React.createRef();

    this.renderErrors = this.renderErrors.bind(this)
  }
  
  componentDidMount() {
    if (!this.props.publicKey) {
      this.props.generateKey();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!this.props.publicKey) {
      this.props.generateKey();
    }
  }

  renderErrors() {
    if (Object.keys(this.props.errors).length > 0) {
      const list = Object.keys(this.props.errors).map((e) => {
        const field = e.startsWith('encrypted') ? 'password' : e
        return `${field} ${this.props.errors[e][0]}`
      })
      return (
        <Message
          error
          header='Error'
          list={list}
        />
      )
    }
  }

  render() {
    if (this.props.signedIn) {
      return (
        <Redirect to='/' />
      )
    }
    else if (!this.props.publicKey) {
      return (
        <Modal basic open={true} closeOnDimmerClick={false} size='small'>
          <Loader content='Generating secure key...' />
        </Modal>
      )
    }
    return (
      <Container>
        <br />
        <Segment >
          <Header content={this.props.actionName} />
            <Form>
              <Form.Field>
                <label>Email</label>
                <input ref={this.emailRef}/>
              </Form.Field>
              <Form.Field >
                <label>Password</label>
                <input type="password" ref={this.passwordRef}/>
              </Form.Field>
            </Form>
            <br />
            {this.renderErrors()}
            <Button color='green' inverted onClick={() => this.props.action(this.emailRef.current.value, this.passwordRef.current.value)}>
              <Icon name='checkmark' />{this.props.actionName}
            </Button>
        </Segment>
      </Container>
    )
  }
}

export default SignUp
