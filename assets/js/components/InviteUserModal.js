import React, { Component } from 'react'
import QRCode from 'qrcode'

class InviteUserModal extends Component {
  constructor(props) {
    super(props);
    this.qr = React.createRef();
    this.qrUrl = "https://groupchat.kenforthewin.com/t/" + this.props.qrInput;
  }

  componentDidMount() {
    QRCode.toCanvas(this.qr.current, this.qrUrl);
  }

  render() {
    return (
      <canvas ref={this.qr} />
    );
  }
}

export default InviteUserModal;