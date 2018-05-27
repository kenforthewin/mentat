import React, {Component} from 'react';
import {Comment, Card, Image} from 'semantic-ui-react';
import moment from 'moment';
import TimeAgo from 'react-timeago'

export default class RenderedText extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const data = this.props.urlData;
    if(data.content_type.startsWith('image')) {
      return (
        <Card as='a' href={data.url} rel="nofollow" target="_">
          <Image src={data.url} onLoad={this.props.scrollDown} />
        </Card>
      );
    } else if (data.content_type.startsWith('text/html')) {
      return (
        <Card as='a' href={data.url} rel="nofollow" target="_">
          <Image src={data.image} onLoad={this.props.scrollDown} />
          <Card.Content>
            <Card.Header>
              {data.title}
            </Card.Header>
            <Card.Description>
              {data.description}
            </Card.Description>
          </Card.Content>
        </Card>
      );
    }

    return null;
  }
}
