import React, {Component} from 'react';
import {Comment, Label, Dropdown, Input} from 'semantic-ui-react'
import { Link } from 'react-router-dom';
import emoji from 'node-emoji';
import Linkify from 'react-linkify'
import TimeAgo from 'react-timeago'
import moment from 'moment'

export default class RenderedMessage extends Component {
  constructor(props) {
    super(props);

  }

  render() {
    let labels = this.props.tags.map((t, i) => {
      return (
        <Label size="mini" as='a' key={i} onClick={this.props.onTagClick}>{t}</Label>
      )
    });
    labels[labels.length] = <Label key={labels.length + 1} size='mini'><Input className='newTagInput' onKeyPress={(e) => this.props.handleNewTagOnMessage(e, this.props.id)} transparent placeholder='+'/></Label>

    const emojiText = emoji.emojify(this.props.text);
    return (
      <Comment>
        <Comment.Avatar style={{ backgroundColor: this.props.color, height: '2.5em'}}/>
        <Comment.Content>
          <Comment.Author as='a'>{this.props.name}</Comment.Author>
          <Comment.Metadata>
            <TimeAgo date={moment.utc(this.props.timestamp)} minPeriod={15}/>
            {labels}
          </Comment.Metadata>
          <Comment.Text style={{fontSize: '16px'}}><Linkify>{emojiText}</Linkify></Comment.Text>
        </Comment.Content>
      </Comment>
    );
  }
}