import React, { Component } from 'react';
import { Segment, Comment, Rail, Icon, Label, Ref, Transition, Dimmer, Loader, Item, Message} from 'semantic-ui-react'
import TimeAgo from 'react-timeago'
import moment from 'moment'
import Linkify from 'react-linkify'
import emoji from 'node-emoji';
import RenderedMessage from './RenderedMessage';

class ChatSegment extends Component {
  constructor(props) {
    super(props)
    this.segmentStyles = {
      overflowY: 'scroll',  
      WebkitOverflowScrolling: 'touch',
      height: '100%'
    }
    this.chatSegment = React.createRef();
    this.renderMessage = this.renderMessage.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.loadingMessages = false;
    this.lastMessageLoaded = false;
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    return this.chatSegment.scrollHeight;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((prevProps.messages !== this.props.messages && this.props.messages.length > 0) || prevProps.typingLabelVisible !== this.props.typingLabelVisible) {
      const node = this.chatSegment;
      if (this.props.updateType === 'append') {
        node.scrollTop = node.scrollHeight - node.clientHeight;
      }
      else if (this.props.updateType === 'prepend') {
        node.scrollTop = node.scrollHeight - snapshot;
        this.loadingMessages = false;
      }
    }
  }

  renderMessage(color, name, text, timestamp, tags, i=0, avatar='/images/matt.jpg') {
    const labels = tags.map((t, i) => {
      return (
        <Label size="mini" as='a' key={i} onClick={this.props.onTagClick}>{t}</Label>
      )
    });
    const emojiText = emoji.emojify(text);
    return (
      <Comment key={i}>
        <Comment.Avatar style={{ backgroundColor: color, height: '2.5em'}}/>
        <Comment.Content>
          <Comment.Author as='a'>{name}</Comment.Author>
          <Comment.Metadata>
            <TimeAgo date={moment.utc(timestamp)} minPeriod={15}/>
            {labels}
          </Comment.Metadata>
          <Comment.Text><Linkify>{emojiText}</Linkify></Comment.Text>
        </Comment.Content>
      </Comment>
    );
  }
  
  handleRef = node => this.chatSegment = node

  renderMessages() {
    const messages = this.props.messages;
    return messages.map((message, i) => {
      return (
        <RenderedMessage
            color={message.color}
            name={message.name}
            text={message.text}
            timestamp={message.timestamp}
            tags={message.tags}
            key={i}
            onTagClick={this.props.onTagClick} />
      )
    });
  }

  handleScroll(e) {
    const node = this.chatSegment;
    if (!this.props.lastMessageLoaded && !this.loadingMessages && node.scrollTop === 0 && this.props.messages.length > 0) {
      this.loadingMessages = true;
      this.props.loadMoreMessages(node);
    }
  }

  scrollOnStart = () => {
    this.chatSegment.scrollTop = this.chatSegment.scrollHeight - this.chatSegment.clientHeight;
  }

  render() {
    return (
      <Ref innerRef={this.handleRef}>
        <Segment raised style={this.segmentStyles} onScroll={this.handleScroll}>
          <div style={{width: '100%'}}>
            <Comment.Group style={{ maxWidth: '100%' }}>
              {this.renderMessages()}
              <div style={{ display: this.props.typingLabelVisible ? 'block' : 'none' }}>
                {this.props.typingLabelContent}
              </div>
            </Comment.Group>
          </div>
        </Segment>
        </Ref>
    );
  }
}

export default ChatSegment;