import React, { Component } from 'react';
import { Segment, Comment, Rail, Icon, Label} from 'semantic-ui-react'
import TimeAgo from 'react-timeago'
import moment from 'moment'
class ChatSegment extends Component {
  constructor(props) {
    super(props)
    this.segmentStyles = {
      flex: '3 0 50%',
      maxHeight: '95vh',
      display: 'flex',
      flexDirection: 'column',

    }
    this.chatSegment = React.createRef();
  }

  componentDidUpdate() {
    let node = this.chatSegment.current;
    node.scrollTop = node.scrollHeight - node.clientHeight;
  }

  renderMessage(name, text, timestamp, tags, i=0, avatar='/images/matt.jpg') {
    const labels = tags.map((t, i) => {
      return (
        <Label size="mini" as='a' key={i}>{t}</Label>
      )
    });

    return (
      <Comment key={i}>
        <Comment.Avatar src={avatar} />
        <Comment.Content>
          <Comment.Author as='a'>{name}</Comment.Author>
          <Comment.Metadata>
            <TimeAgo date={moment.utc(timestamp)} minPeriod={15}/>
            {labels}
          </Comment.Metadata>
          <Comment.Text>{text}</Comment.Text>
        </Comment.Content>
      </Comment>
    );
  }

  renderMessages() {
    const messages = this.props.messages;
    return messages.map((message, i) => {
      return this.renderMessage(message.name, message.text, message.timestamp, message.tags, i);
    });
  }

  render() {
    return (
      <Segment raised style={this.segmentStyles}>
        <div style={{ overflowY: 'scroll',  WebkitOverflowScrolling: 'touch', width: '100%', flex: 1}} ref={this.chatSegment} >
          <Comment.Group style={{ maxWidth: '100%' }}>
            {this.renderMessages()}
          </Comment.Group>
        </div>
      </Segment>
    );
  }
}

export default ChatSegment;