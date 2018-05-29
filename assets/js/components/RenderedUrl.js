import React, {Component} from 'react';
import {Comment, Card, Image} from 'semantic-ui-react';
import moment from 'moment';
import TimeAgo from 'react-timeago'

export default class RenderedText extends Component {
  constructor(props) {
    super(props);
    this.maybeRenderImage = this.maybeRenderImage.bind(this);
  }

  maybeRenderImage(url) {
    if(url && url.startsWith('https')) {
      return (
        <Image src={url} onLoad={this.props.scrollDown} />
      );
    }

    return null;
  }

  render() {
    const data = this.props.urlData;
    if(data.content_type.startsWith('image')) {
      return (
        <Card as='a' href={data.url} rel="nofollow" target="_">
          {this.maybeRenderImage(data.url)}
        </Card>
      );
    } else if (data.content_type.startsWith('text/html')) {
      return (
        <Card as='a' href={data.url} rel="nofollow" target="_">
          {this.maybeRenderImage(data.image)}
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
