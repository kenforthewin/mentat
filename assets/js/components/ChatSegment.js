import React, { Component } from 'react';
import { Segment, Comment, Rail, Icon, Label, Ref, Transition, Dimmer, Loader, Item, Message} from 'semantic-ui-react'
import TimeAgo from 'react-timeago'
import moment from 'moment'
import Linkify from 'react-linkify'
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
    this.handleScroll = this.handleScroll.bind(this);
    this.scrollDown = this.scrollDown.bind(this);
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

  scrollDown() {
    this.chatSegment.scrollTop = this.chatSegment.scrollHeight - this.chatSegment.clientHeight;
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
            id={message.id}
            key={i}
            onTagClick={this.props.onTagClick} 
            handleNewTagOnMessage={this.props.handleNewTagOnMessage}
            scrollDown={this.scrollDown}
            />
      )
    });
  }

  handleScroll(e) {
    const node = this.chatSegment;
    if (!this.props.lastMessageLoaded && !this.props.loadingMessages && node.scrollTop === 0 && this.props.messages.length > 0) {
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