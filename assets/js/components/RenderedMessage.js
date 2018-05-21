import React, {Component} from 'react';
import {Comment, Label} from 'semantic-ui-react'
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
    const labels = this.props.tags.map((t, i) => {
      return (
        <Label size="mini" as='a' key={i} onClick={this.props.onTagClick}>{t}</Label>
      )
    });
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
          <Comment.Text><Linkify>{emojiText}</Linkify></Comment.Text>
        </Comment.Content>
      </Comment>
    );
  }
}