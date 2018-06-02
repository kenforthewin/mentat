import React, { Component } from 'react'
import { Segment, Form, TextArea, Container, Comment, Button, Rail, Icon, Dropdown, Label, Header, Modal, Popup, Transition, Item,Loader } from 'semantic-ui-react'
import { Socket, Presence } from "phoenix"
import moment from 'moment'
import ChatSegment from './ChatSegment';
import { connect } from 'react-redux';
import {updateName} from '../actions/userActions';
import { Link } from 'react-router-dom';
import Huebee from 'huebee';
import twitter from 'twitter-text';
import OnlineUsersDropdown from './OnlineUsersDropdown';
import MainMenuDropdown from './MainMenuDropdown';
import TagsDropdown from './TagsDropdown';
import MessageForm from './MessageForm';
import UserModal from './UserModal';
import {addMessage,newUrl,newTag,refreshTags,removeTag} from '../actions/messageActions';

let openpgp =  require('openpgp');

import { generateKeypair, generateGroupKeypair, receiveGroupKeypair } from '../actions/cryptoActions';

class App extends Component {
  constructor(props) {
    super(props);
    this.typing = false;
    this.privKeyObj = null;
    this.pubKeyObj = null;
    this.state = { 
      messageIds: [], 
      messages: [], 
      tags: [], 
      tagOptions: [],
      tagCounts: {},
      modalOpen: !this.props.userReducer.name || this.props.userReducer.name.length < 1, 
      updateType: 'append', 
      lastMessageLoaded: false, 
      presences: {}, 
      typing: [], 
      requests: {}, 
      messagesLoading: true };

    this.room = props.match.params.room

    this.handleMessage = this.handleMessage.bind(this);
    this.initializeMessages = this.initializeMessages.bind(this);
    this.updateTags = this.updateTags.bind(this);
    this.dropdownOptions = this.dropdownOptions.bind(this);
    this.getTags = this.getTags.bind(this);
    this.clickTag = this.clickTag.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.loadMoreMessages = this.loadMoreMessages.bind(this);
    this.typeTimeoutFn = this.typeTimeoutFn.bind(this);
    this.isTypingLabelVisible = this.isTypingLabelVisible.bind(this);
    this.typingLabelContent = this.typingLabelContent.bind(this);
    this.requestClaimOrInvite = this.requestClaimOrInvite.bind(this);
    this.approveRequest = this.approveRequest.bind(this);
    this.pushNewTags = this.pushNewTags.bind(this);
    this.dismissRequest = this.dismissRequest.bind(this);
    this.processTagFromInput = this.processTagFromInput.bind(this);
    this.handleNewTagOnMessage = this.handleNewTagOnMessage.bind(this);
    this.setupNotifications = this.setupNotifications.bind(this);
    this.maybeNotify = this.maybeNotify.bind(this);
    this.cachedMessage = this.cachedMessage.bind(this);
    this.displayedMessages = this.displayedMessages.bind(this);
    this.removeMessageTag = this.removeMessageTag.bind(this);

    this.nameInput = React.createRef();
    this.colorInput = React.createRef();

    this.pgpWorkerStarted = openpgp.initWorker({ path:'/js/openpgp.worker.min.js' })

    this.mainStyles = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.cryptoReducer.groups[this.room] != this.props.cryptoReducer.groups[this.room] ) {
      this.pushNewTags(this.state.tags);
    }

    if(!this.props.cryptoReducer.groups[this.room] && prevProps.userReducer.name !== this.props.userReducer.name) {
      this.requestClaimOrInvite()
    }
  }

  requestClaimOrInvite() {
    this.channel.push("new_claim_or_invite", {uuid: this.props.userReducer.uuid, name: this.props.userReducer.name, publicKey: this.props.cryptoReducer.publicKey});
  }

  cachedMessage(id) {
    return this.props.messageReducer.messages[id];
  }

  componentDidMount() {
    let socket = new Socket("/socket", {params: {token: window.userToken, uuid: this.props.userReducer.uuid}});
    socket.connect();
    this.channel = socket.channel(`room:${this.room}`, {tags: this.state.tags, uuid: this.props.userReducer.uuid, color: this.props.userReducer.color});

    this.channel.on("presence_state", state => {
      this.setState({
        ...this.state,
        presences: Presence.syncState(this.state.presences, state)
      });
    });

    this.channel.on("presence_diff", diff => {
      this.setState({
        ...this.state,
        presences: Presence.syncDiff(this.state.presences, diff)
      });
    });

    this.channel.on("approve_request", payload => {
      if (payload.uuid === this.props.userReducer.uuid && !this.props.cryptoReducer.groups[this.room]) {
        this.props.receiveGroupKeypair(this.room, payload.group_public_key, payload.encrypted_group_private_key);
      }
      let {[payload.uuid]: _, ...filteredRequests} = this.state.requests;
      this.setState({
        ...this.state,
        requests: filteredRequests
      })
    });

    this.channel.on("new_tag_counts", payload => {
      const tagCounts = {};
      payload.tagCounts.forEach((e) => tagCounts[e.name] = e.message_count);
      this.setState({
        ...this.state,
        tagCounts
      });
    });

    this.channel.on("new_name", payload => {
      const oldMetas = this.state.presences[payload.uuid] ? this.state.presences[payload.uuid].metas : []
      const newMetas = oldMetas.length > 0 ? [
        {
          ...oldMetas[0],
          name: payload.name,
          color: payload.color,
        },
        ...oldMetas.slice(1)
      ] : [
        {
          name: payload.name,
          color: payload.color,        
        }
      ]
      this.setState({
        ...this.state,
        presences: {
          ...this.state.presences,
          [payload.uuid]: {
            metas: newMetas
          }
        }
      })
    });

    this.channel.on("new_claim_or_invite", payload => {
      if (payload.claimed && payload.uuid === this.props.userReducer.uuid) {
        this.props.generateGroupKeypair(this.room)
      } else if (!payload.claimed){
        const newRequests = Object.keys(this.state.requests).includes(payload.uuid) ? this.state.requests : {
          ...this.state.requests,
          [payload.uuid]: {
            uuid: payload.uuid,
            name: payload.name,
            publicKey: payload.public_key
          }
        }
        this.setState({
          ...this.state,
          requests: newRequests
        })
      }
    });

    this.channel.on("new_typing", payload => {

      let newTyping;

      if (payload.typing) {
        newTyping = this.state.typing.includes(payload.uuid) || this.props.userReducer.uuid === payload.uuid ? this.state.typing : [
          ...this.state.typing,
          payload.uuid
        ]
      } else {
        newTyping = this.state.typing.filter(e => e !== payload.uuid);
      }
      this.setState({
        ...this.state,
        updateType: 'append',
        typing: newTyping
      })
    });

    this.channel.on("remove_tag", payload => {
      this.props.removeTag(payload.id, payload.tag);
    });

    this.channel.on("new_msg", payload => {
      let tags = this.state.tagOptions;
      let postMessage = false;
      payload.tags.forEach((t) => {
        tags = tags.includes(t) ? tags : tags.concat([t]);
        postMessage = postMessage || this.state.tags.includes(t);
      });
      if (this.state.tags.length === 0 || postMessage) {
       this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];
        const options = {
          message: openpgp.message.readArmored(payload.text),     // parse armored message
          privateKeys: [this.privKeyObj]                            // for decryption
        };
        openpgp.decrypt(options).then((plaintext) => {
          const newMessage = {id: payload.id, name: payload.name, text: plaintext.data, color: payload.color, timestamp: moment().format(), tags: payload.tags, uuid: payload.uuid }
          this.props.addMessage(newMessage);
          this.setState({
            ...this.state,
            tagOptions: tags,
            messageIds: [
              ...this.state.messageIds,
              payload.id
            ],
            updateType: 'append'
          });
          this.maybeNotify(newMessage);
        });
      }
    });

    this.channel.on("new_url_data", payload => {
      // const cachedMessage = this.cachedMessage(payload.id);
      // if (cachedMessage) {
        this.props.newUrl(payload.id, payload.url_data);
      // }
    });

    this.channel.on("new_message_tag", payload => {
      const newPossibleTags = this.state.tagOptions.includes(payload.new_tag) ? this.state.tagOptions : [
        ...this.state.tagOptions,
        payload.new_tag
      ];
      this.setState({
        ...this.state,
        tagOptions: newPossibleTags
      })
      this.props.newTag(payload.id, payload.new_tag);
    })

    this.channel.join()
      .receive("ok", resp => {
        if (this.props.cryptoReducer.groups[this.room]) {
          this.initializeMessages(resp.messages.messages);
          this.props.updateName(resp.name, resp.color);
          this.getTags(resp.tags.tags);
        } else if (!this.props.cryptoReducer.publicKey) {
            this.props.generateKeypair();
        }
        else {
          this.requestClaimOrInvite();
        }
      }).receive("error", resp => { console.log("Unable to join", resp) });

    this.setupNotifications();
  }

  removeMessageTag(id, tag) {
    this.channel.push("remove_tag", {id, tag});
  }

  maybeNotify(message) {
    if (!("Notification" in window)) {
      // alert("This browser does not support system notifications");
    }
    else if (Notification.permission === "granted") {
      if (message.uuid !== this.props.userReducer.uuid && document.hidden) {
        var notification = new Notification(message.name, {body: message.text});
      }
    }
  }

  setupNotifications() {
    if (!("Notification" in window)) {
      // alert("This browser does not support system notifications");
    }

    else if (Notification.permission === "granted") {
      // var notification = new Notification("Hi there!");
    }
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        // if (permission === "granted") {
        //   // var notification = new Notification("Hi there!");
        // }
      });
    }
  }

  componentWillUnmount() {
    this.channel.leave();
  }

  getTags(tags) {
    const tagCounts = {};
    tags.forEach((e) => tagCounts[e.name] = e.message_count);
    this.setState({
      ...this.state,
      tagOptions: tags.map(t => t.name),
      tagCounts
    });
  }

  displayedMessages() {
    return this.state.messageIds
        .map((id) => this.props.messageReducer.messages[id])
        .filter((m) => m);
  }

  async initializeMessages(messages) {
    this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];
    await Promise.all(messages.map(async (m, i) => {
      const cachedMessage = this.cachedMessage(m.id);
      if (!cachedMessage) {
        const options = {
          message: openpgp.message.readArmored(m.body),     // parse armored message
          privateKeys: [this.privKeyObj]                            // for decryption
        };
        const decryption = await openpgp.decrypt(options)
        const newMessage = {urlData: m.url_data, id: m.id, name: m.user.name, color: m.user.color, text: decryption.data, timestamp: m.inserted_at, tags: m.tags.map(t => t.name)}
        this.props.addMessage(newMessage);
      } else {
        this.props.refreshTags(m.id, m.tags.map(t => t.name));
      }
    }));
    if(messages.length === 0) {
      this.setState({
        ...this.state,
        messageIds: [],
        updateType: 'append',
        messagesLoading: false,
        lastMessageLoaded: true

      })
    } else {
      this.setState({
        messageIds: messages.map((m) => m.id).reverse(),
        updateType: 'append',
        messagesLoading: false,
        lastMessageLoaded: false
      })
    }
  }

  typeTimeoutFn() {
    this.typing = false;
    this.channel.push("new_typing", {uuid: this.props.userReducer.uuid, typing: false});
  }

  pushNewTags(tags, tagOptions = this.state.tagOptions) {
    this.setState({
      ...this.state,
      tags,
      tagOptions,
      messagesLoading: true
    }, () => {
      this.channel.push("new_tags", {tags})
          .receive("ok", (payload) => {
            this.initializeMessages(payload.messages.messages);
          });
    })
  }

  handleMessage(e) {
    if (!this.typing) {
      this.typing = true;
      this.channel.push("new_typing", {uuid: this.props.userReducer.uuid, typing: true});
      this.typeTimeout = setTimeout(this.typeTimeoutFn, 1000);
    } else {
      clearTimeout(this.typeTimeout);
      this.typeTimeout = setTimeout(this.typeTimeoutFn, 1000);
    }

    if (e.key === "Enter") {
      e.preventDefault()
      this.typing = false;
      clearTimeout(this.typeTimeout);
      this.channel.push("new_typing", {uuid: this.props.userReducer.uuid, typing: false});

      if(e.target.value.length > 0 ) {
        if (e.target.value[0] === '#' && !e.target.value.includes(" ")) {
          return this.processTagFromInput(e);
        }
        this.pubKeyObj = this.pubKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].publicKey).keys
        const message = e.target.value;
        const extractedTags = twitter.extractHashtags(message);
        const options = {
          data: message,
          publicKeys: this.pubKeyObj,
          armored: false
        };
        let allTags = this.state.tags;
        const urls = twitter.extractUrls(message).map((url) => url.startsWith('http') ? url : 'https://' + url);
        extractedTags.forEach((extractedTag) => {
          allTags = allTags.includes(extractedTag) ? allTags : [
            ...allTags,
            extractedTag
          ]
        })

        openpgp.encrypt(options).then((ciphertext) => {
          const encrypted = ciphertext.data;
          this.channel.push("new_msg", {urls: urls, text: encrypted, uuid: this.props.userReducer.uuid, tags: allTags, room: this.room});
        });
        e.target.value = '';
      }
    } 
    // else if ((e.key === "Spacebar" || e.key === " ") && e.target.value && e.target.value[0] === '#' && !e.target.value.includes("\w")) {
    //   e.preventDefault();
    //   this.processTagFromInput(e);
    // }
  }

  processTagFromInput(e) {
    if (e.target.value[1] === '#') {
      const soleTag = e.target.value.slice(2);
      const newPossibleTags = this.state.tagOptions.includes(soleTag) ? this.state.tagOptions : [
        ...this.state.tagOptions,
        soleTag
      ];
      e.target.value = null;
      return this.pushNewTags([soleTag], newPossibleTags)
    }

    const newTag = e.target.value.slice(1);
    e.target.value = null;
    const newTags = this.state.tags.includes(newTag) ? this.state.tags : [
      ...this.state.tags,
      newTag
    ];
    const newPossibleTags = this.state.tagOptions.includes(newTag) ? this.state.tagOptions : [
      ...this.state.tagOptions,
      newTag
    ];
    this.pushNewTags(newTags, newPossibleTags);
  }

  clickTag(e) {
    const tag = e.target.text;
    const newTags = this.state.tags.includes(tag) ? this.state.tags : [
      ...this.state.tags,
      tag
    ];
    this.pushNewTags(newTags);
  }

  updateTags(e, data) {
    this.pushNewTags(data.value)
  }

  dropdownOptions() {
    return this.state.tagOptions
        .map(t => { return({text: t, value: t, description: this.state.tagCounts[t]});});
  }

  onModalClose(e) {
    const name = this.nameInput.current.value;
    const color = this.colorInput.current.value;
    this.channel.push("new_name", {name, color, uuid: this.props.userReducer.uuid});
    this.props.updateName(name, color)
    this.setState({
      ...this.state,
      modalOpen: false
    })
  }

  async loadMoreMessages() {
    this.setState({
      ...this.state,
      messagesLoading: true
    })
    const id = this.state.messageIds[0];
    await this.channel.push("more_messages", {id, tags: this.state.tags, room: this.room})
        .receive("ok", async (payload) => {
          const messages = payload.messages.messages;
          this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];

          await Promise.all(messages.map(async (m, i) => {
            const cachedMessage = this.cachedMessage(m.id);
            if (!cachedMessage) {
              const options = {
                message: openpgp.message.readArmored(m.body),     // parse armored message
                privateKeys: [this.privKeyObj]                            // for decryption
              };
              const decrypt = await openpgp.decrypt(options);
              const newMessage = {id: m.id, name: m.user.name, color: m.user.color, text: decrypt.data, timestamp: m.inserted_at, tags: m.tags.map(t => t.name)}
              this.props.addMessage(newMessage);
            } else {
              this.props.refreshTags(m.id, m.tags.map(t => t.name));
            }
          }));

          this.setState({
            ...this.state,
            messageIds: [
              ...messages.map((m) => m.id).reverse(),
              ...this.state.messageIds
            ],
            updateType: 'prepend',
            messagesLoading: false,
            lastMessageLoaded: messages.length < 1
          });
        });
  }

  approveRequest(e) {
    e.preventDefault();
    const data = e.target.dataset;

    const options = {
      data: this.props.cryptoReducer.groups[this.room].privateKey,
      publicKeys: openpgp.key.readArmored(data.publicKey).keys
    };
    
    openpgp.encrypt(options).then((ciphertext) => {
      const encrypted = ciphertext.data;
      this.channel.push("approve_request", { uuid: data.uuid, groupPublicKey: this.props.cryptoReducer.groups[this.room].publicKey, encryptedGroupPrivateKey: encrypted})
    });
  }

  dismissRequest(e) {
    e.preventDefault();
    const data = e.target.dataset;
    let {[data.uuid]: _, ...filteredRequests} = this.state.requests;
    this.setState({
      ...this.state,
      requests: filteredRequests
    })
  }

  isTypingLabelVisible() {
    const thoseTyping = this.state.typing;

    return thoseTyping.length > 0;
  }

  typingLabelContent() {
    if (!this.isTypingLabelVisible()) {
      return '';
    }
    const thoseTyping = this.state.typing.map(e => this.state.presences[e] ? this.state.presences[e].metas[0].name : 'no-name');
    const typingString = thoseTyping.join(' & ') + ' typing...'
    return typingString;
  }

  renderGate() {
    return (
      <Modal basic open={true} closeOnDimmerClick={false} size='small'>
        <Header icon='user circle' content='You dont yet have access to this group.' />
      </Modal>
    )
  }

  handleNewTagOnMessage(e, id) {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log(e);
      const newTag = e.target.value;
      this.channel.push("new_message_tag", {id, newTag})
      e.target.value = '';
    } else if (e.key === " ") {
      e.preventDefault();
    }
  }

  renderLoadingKey() {
    return (
      <Modal basic open={true} closeOnDimmerClick={false} size='small'>
        <Loader content='Generating secure key...' />
      </Modal>
    )
  }

  render() {
    if (!this.props.cryptoReducer.publicKey) {
      return this.renderLoadingKey();
    }
    else if (this.props.userReducer.name && this.props.userReducer.name.length > 1 && !this.props.cryptoReducer.groups[this.room]) {
      return this.renderGate();
    }
    return (
      <div style={this.mainStyles}>
        <UserModal
            modalOpen={this.state.modalOpen}
            name={this.props.userReducer.name}
            colorInput={this.colorInput}
            nameInput={this.nameInput}
            color={this.props.userReducer.color}
            onModalClose={this.onModalClose} />
        <Loader active={this.state.messagesLoading} />
        <div style={{flex: 0, display: 'flex', minHeight: '2.71428571em', alignItems: 'center'}}>
          <OnlineUsersDropdown 
              presences={this.state.presences} 
              requests={this.state.requests} 
              approveRequest={this.approveRequest} 
              dismissRequest={this.dismissRequest} />
          <TagsDropdown
              tags={this.state.tags}
              tagCounts={this.state.tagCounts}
              dropdownOptions={this.dropdownOptions}
              updateTags={this.updateTags}
          />
          <MainMenuDropdown
              changeName={() => this.setState({...this.state, modalOpen: true})} />
        </div>
        <ChatSegment
            messages={this.displayedMessages()} 
            lastMessageLoaded={this.state.lastMessageLoaded} 
            onTagClick={this.clickTag} 
            style={{ flex: '1 0', height: '100%'}} 
            loadMoreMessages={this.loadMoreMessages}
            messagesLoading={this.state.messagesLoading}
            updateType={this.state.updateType} 
            typingLabelVisible={this.isTypingLabelVisible()} 
            typingLabelContent={this.typingLabelContent()} 
            handleNewTagOnMessage={this.handleNewTagOnMessage}
            messageIds={this.state.messageIds}
            removeMessageTag={this.removeMessageTag}
            />
            
        <MessageForm
            handleMessage={this.handleMessage} />
      </div> );
  }
}

const mapStateToProps = (state) => {
  const { userReducer, cryptoReducer, messageReducer } = state;
  return { userReducer, cryptoReducer, messageReducer };
}
const mapDispatchToProps = (dispatch) => {
  return {
    refreshTags: (id, tags) => dispatch(refreshTags(id, tags)),
    newTag: (id, tag) => dispatch(newTag(id, tag)),
    removeTag: (id, tag) => dispatch(removeTag(id, tag)),
    newUrl: (id, urlData) => dispatch(newUrl(id, urlData)),
    addMessage: (message) => dispatch(addMessage(message)),
    updateName: (name, color) => dispatch(updateName(name, color)),
    generateKeypair: () => dispatch(generateKeypair()),
    generateGroupKeypair: (room) => dispatch(generateGroupKeypair(room)),
    receiveGroupKeypair: (room, publicKey, encryptedPrivateKey) => dispatch(receiveGroupKeypair(room, publicKey, encryptedPrivateKey))
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(App);