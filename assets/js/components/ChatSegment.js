import React, { Component } from 'react';
import { Segment, Comment, Label, Ref} from 'semantic-ui-react'
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
    this.maybeScrollDown = this.maybeScrollDown.bind(this);
    this.loadingMessages = false;
    this.lastMessageLoaded = false;
    this.scrolledDown = true;
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    return {scrollHeight: this.chatSegment.scrollHeight };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.messageIds !== this.props.messageIds && this.props.messageIds.length > 0) {
      const node = this.chatSegment;
      if (this.props.updateType === 'append' && this.scrolledDown) {
        node.scrollTop = node.scrollHeight - node.clientHeight;
      }
      else if (this.props.updateType === 'prepend') {
        node.scrollTop = node.scrollHeight - snapshot.scrollHeight;
        this.loadingMessages = false;
      }
    }
  }

  scrollDown() {
    this.chatSegment.scrollTop = this.chatSegment.scrollHeight - this.chatSegment.clientHeight;
  }

  maybeScrollDown() {
    if (this.scrolledDown) {
      this.scrollDown();
    }
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
            scrollDown={this.maybeScrollDown}
            urlData={message.urlData}
            removeMessageTag={this.props.removeMessageTag}
            user={this.props.usersReducer.users[message.uuid]}
            style={{flex: '0 1 auto'}}
            />
      )
    });
  }

  handleScroll(e) {
    const node = this.chatSegment;
    this.scrolledDown = node.scrollTop === node.scrollHeight - node.clientHeight;
    if (this.props.loadingMessages) {
      e.preventDefault()
      return false;
    }
    if (!this.props.lastMessageLoaded && !this.props.loadingMessages && node.scrollTop === 0 && this.props.messages.length > 0) {
      this.props.loadMoreMessages();
    }
  }

  render() {
    return (
      <Ref innerRef={this.handleRef}>
        <Segment raised style={this.segmentStyles} onWheel={this.handleScroll} onScroll={this.handleScroll}>
            <Comment.Group style={{ maxWidth: '100%', minHeight: '100%', margin: '0 0 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {this.renderMessages()}
            </Comment.Group>
            <Label size='small' color="black" style={{ display: this.props.typingLabelVisible ? 'block' : 'none', bottom: '6em', marginLeft: 'auto', position: 'fixed' }}>
              {this.props.typingLabelContent}
            </Label>
        </Segment>
      </Ref>
    );
  }
}

export default ChatSegment;