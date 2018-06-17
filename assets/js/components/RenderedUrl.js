import React, {Component} from 'react';
import { Item } from 'semantic-ui-react';

export default class RenderedText extends Component {
  constructor(props) {
    super(props);
    this.maybeRenderImage = this.maybeRenderImage.bind(this);
  }

  componentDidMount() {
    this.props.scrollDown();
  }

  maybeRenderImage(url, image = false) {
    if(url && url.startsWith('https')) {
      const size = image ? 'large' : 'small'
      return (
        <Item.Image size={size} src={url} onLoad={this.props.scrollDown} />
      );
    }

    return null;
  }

  render() {
    const data = this.props.urlData;
    if(data.content_type.startsWith('image')) {
      return (
        <Item.Group>
          <Item as='a' href={data.url} rel="nofollow" target="_blank">
            {this.maybeRenderImage(data.url, true)}
          </Item>
        </Item.Group>
      );
    } else if (data.content_type.startsWith('text/html')) {
      return (
        <Item.Group>
          <Item as='a' href={data.url} rel="nofollow" target="_blank">
            {this.maybeRenderImage(data.image)}
            <Item.Content >
              <Item.Header>{data.title}</Item.Header>
              <Item.Description>{data.description}</Item.Description>
            </Item.Content>
          </Item>
        </Item.Group>

      );
    }

    return null;
  }
}
