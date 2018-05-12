import React, { Component } from 'react';
import { Form } from 'semantic-ui-react'
import Huebee from 'huebee'
class ColorPicker extends Component {
  constructor(props) {
    super(props)
  }
  
  componentDidMount() {
    new Huebee(this.props.inputRef.current, {})
  }
  
  render() {
    return (
      <Form.Field>
        <input defaultValue={this.props.color} ref={this.props.inputRef}/>
      </Form.Field>
    )
  }
}

export default ColorPicker;