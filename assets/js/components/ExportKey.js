import React, { Component } from 'react'
import { Segment, Button, Icon, Message, Container } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { saveAs } from 'file-saver';

class ExportKey extends Component {
  constructor(props) {
    super(props)

    this.onClick = this.onClick.bind(this)
  }

  onClick() {
    const { publicKey, privateKey, passphrase } = this.props.cryptoReducer
    const keyObject = { publicKey, privateKey, passphrase }
    const keyBlob = new Blob([JSON.stringify(keyObject)], {type: "text/plain;charset=utf-8"});
    saveAs(keyBlob, "chat-key.json");
  }

  render() {
    if (!this.props.userReducer.token) {
      return ( <Redirect to='/' /> )
    }
    return (
      <Container>
        <br />
        <Segment compact>
          <Message>
            <Message.Header>Export key</Message.Header>
            <p>
              Press the button below to export your private account key to a file. Keep this file safe and secure: you can use it to restore your account if you ever lose access.
            </p>
          </Message>
          <br />
          <Button onClick={this.onClick} ><Icon name='key' />Export key</Button>
        </Segment>
      </Container>
    )
  }
}

const mapStateToProps = (state) => {
  const { userReducer, cryptoReducer } = state
  return { userReducer, cryptoReducer }
}

export default connect(mapStateToProps, {})(ExportKey)