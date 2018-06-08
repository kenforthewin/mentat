import React, {Component} from 'react';
import {Comment, Label, Dropdown, Input, Icon} from 'semantic-ui-react'
import { Link } from 'react-router-dom';
import EmojiConvertor from 'emoji-js';
import Linkify from 'react-linkify'
import TimeAgo from 'react-timeago'
import moment from 'moment'
import twitter from 'twitter-text'
import RenderedUrl from './RenderedUrl';

export default class RenderedMessage extends Component {
  constructor(props) {
    super(props);
    this.maybeRenderUrl = this.maybeRenderUrl.bind(this);
    this.maybeRenderAvatar = this.maybeRenderAvatar.bind(this);
    this.emoji = new EmojiConvertor();
  }

  maybeRenderUrl() {
    if (this.props.urlData && this.props.urlData.show) {
      return <RenderedUrl urlData={this.props.urlData} key={1} scrollDown={this.props.scrollDown}/>
    }

    return null;
  }

  maybeRenderAvatar() {
    if (this.props.user && this.props.user.avatar) {
      return this.props.user.avatar
    }

    return null;
  }

  render() {
    let labels = this.props.tags.map((t, i) => {
      return (
        <Label size="mini" as='a' key={i} onClick={this.props.onTagClick}>{t}</Label>
      )
    });
    labels[labels.length] = <Label key={labels.length + 1} size='mini'><Input className='newTagInput' onKeyPress={(e) => this.props.handleNewTagOnMessage(e, this.props.id)} transparent placeholder='+'/></Label>

    const emojiText = this.emoji.replace_colons(this.props.text);
    const comment = (
      <Comment key={0}>
        <Comment.Avatar style={{ backgroundColor: this.props.color, height: '3.0em', width: '3.0em'}} src={this.maybeRenderAvatar()}/>
          <Comment.Content>
            <Comment.Author as='a' style={{fontSize: '16px'}}>{this.props.name}</Comment.Author>
            <Comment.Metadata style={{fontSize: '12px'}}>
              <TimeAgo date={moment.utc(this.props.timestamp)} minPeriod={15}/>
              {labels}
            </Comment.Metadata>
          <Comment.Text style={{fontSize: '16px'}}>
            <Linkify properties={{target: '_blank', rel: "nofollow"}}>
              {emojiText}
            </Linkify>
            {this.maybeRenderUrl()}
          </Comment.Text>
        </Comment.Content>
      </Comment>
    );

    return comment;
  }
}