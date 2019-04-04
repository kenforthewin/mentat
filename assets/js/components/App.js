import React, { Component } from 'react'
import { Header, Modal, Loader, Container } from 'semantic-ui-react'
import { Socket, Presence } from "phoenix"
import { Redirect } from 'react-router-dom';
import moment from 'moment'
import ChatSegment from './ChatSegment';
import { connect } from 'react-redux';
import {updateName, updateUrlPreviews} from '../actions/userActions';
import twitter from 'twitter-text';
import OnlineUsersDropdown from './OnlineUsersDropdown';
import MainMenuDropdown from './MainMenuDropdown';
import TagsDropdown from './TagsDropdown';
import MessageForm from './MessageForm';
import UserModal from './UserModal';
import {addMessage,newUrl,newTag,refreshTags,removeTag} from '../actions/messageActions';
import {addUser, setLastSynced, expireToken} from '../actions/usersAction';
import { generateKeypair, generateGroupKeypair, receiveGroupKeypair, burnBrowser, newGroupName } from '../actions/cryptoActions';
import {persistor} from '../reducers/index';
import Nav from './Nav';

let openpgp =  require('openpgp');

class App extends Component {
  constructor(props) {
    super(props);
    this.room = props.match.params.room
    this.typing = false;
    this.privKeyObj = null;
    this.pubKeyObj = null;
    this.state = { 
      messageIds: [], 
      messages: [], 
      tags: [], 
      tagOptions: ['general'],
      tagCounts: {},
      modalOpen: !this.props.userReducer.name || this.props.userReducer.name.length < 1, 
      updateType: 'append', 
      lastMessageLoaded: false, 
      presences: {}, 
      typing: [], 
      requests: {}, 
      messagesLoading: true,
      generatingGroupKey: false };

    this.joinChannel = this.joinChannel.bind(this);
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
    this.encryptBlob = this.encryptBlob.bind(this);
    this.syncUsers = this.syncUsers.bind(this);
    this.updateRoomSettings = this.updateRoomSettings.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.receiveMessage = this.receiveMessage.bind(this);
    this.consumeClaim = this.consumeClaim.bind(this);

    this.nameInput = React.createRef();
    this.colorInput = React.createRef();
    // this.avatarInput = React.createRef();
    this.textAreaNode = React.createRef();

    this.pgpWorkerStarted = openpgp.initWorker({ path:'/js/openpgp.worker.min.js' })

    this.mainStyles = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }

  async consumeClaim() {
    const userPublicKey = openpgp.key.readArmored(this.props.cryptoReducer.publicKey).keys
    const options = {
      data: this.props.cryptoReducer.groups[this.room].privateKey,
      publicKeys: userPublicKey
    };
    const encryptObject = await openpgp.encrypt(options)
    this.channel.push("consume_claim", {publicKey: this.props.cryptoReducer.publicKey, teamPublicKey: this.props.cryptoReducer.groups[this.room].publicKey, encryptedTeamPrivateKey: encryptObject.data})
    this.pushNewTags(this.state.tags);
    this.setState({
      ...this.state,
      generatingGroupKey: false
    })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.cryptoReducer.groups[this.room] && this.props.cryptoReducer.groups[this.room].publicKey && !prevProps.cryptoReducer.groups[this.room]) {
      this.consumeClaim()
    }

    if(!this.props.cryptoReducer.groups[this.room] && prevProps.userReducer.name !== this.props.userReducer.name) {
      this.requestClaimOrInvite()
    }

    if (!prevProps.cryptoReducer.publicKey && this.props.cryptoReducer.publicKey) {
      this.joinChannel()
    }
  }

  requestClaimOrInvite() {
    this.channel.push("new_claim_or_invite", {uuid: this.props.userReducer.uuid, name: this.props.userReducer.name, publicKey: this.props.cryptoReducer.publicKey});
  }

  cachedMessage(id) {
    return this.props.messageReducer.messages[id];
  }

  async componentDidMount() {
    if (!this.props.cryptoReducer.publicKey) {
      this.props.burnBrowser()
    } else {
      this.setupNotifications();
      this.joinChannel();
    }
  }

  async joinChannel() {
    let socket = new Socket("/socket", {params: {token: this.props.userReducer.token}});
    socket.connect();
    this.channel = socket.channel(`room:${this.room}`, {tags: this.state.tags});

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

    this.channel.on("update_room_name", payload => {
      this.props.newGroupName(this.room, payload.name);
    });

    this.channel.on("approve_request", payload => {
      if (payload.uuid === this.props.userReducer.uuid) {
        this.props.receiveGroupKeypair(this.room, payload.group_public_key, payload.encrypted_group_private_key, payload.users.requests, payload.name);
      }
      let {[payload.uuid.toString()]: _, ...filteredRequests} = this.state.requests;
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
      if (payload.avatar) {
        this.syncUsers([payload]);
      }
    });

    this.channel.on("new_claim_or_invite", payload => {
      if (payload.claimed && payload.uuid === this.props.userReducer.uuid) {
        this.setState({
          ...this.state,
          generatingGroupKey: true
        })
        this.props.generateGroupKeypair(this.room, payload.roomName)
      } else if (!payload.claimed){
        if (payload.encrypted_private_key) {
          this.props.receiveGroupKeypair(this.room, payload.group_public_key, payload.encrypted_private_key);
        } else {
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
      const currentMessage = this.props.messageReducer.messages[payload.id]
      if (this.props.messageReducer.messages[payload.id]) {
        this.props.removeTag(payload.id, payload.tag);
        if (this.state.messageIds.includes(payload.id)) {
          const newMessageTags = currentMessage.tags.filter((e) => e !== payload.tag)
          let postMessage = false;
          newMessageTags.forEach((t) => {
            postMessage = postMessage || this.state.tags.includes(t);
          });
          if (!postMessage && this.state.tags.length !== 0) {
            this.setState({
              ...this.state,
              messageIds: this.state.messageIds.filter((e) => e !== payload.id)
            })
          }
        }
      }
    });

    this.channel.on("new_msg", payload => {
      this.receiveMessage(payload)
    });

    this.channel.on("new_url_data", payload => {
      this.props.newUrl(payload.id, payload.url_data, payload.tag);
      const tags = this.state.tagOptions
      this.setState({
        tagOptions: tags.includes(payload.tag) ? tags : tags.concat([payload.tag])
      })
    });

    this.channel.on("new_message_tag", payload => {
      if (this.props.messageReducer.messages[payload.id]) {
        this.props.newTag(payload.id, payload.new_tag);
      }

      this.receiveMessage(payload)
    })

    this.channel.join()
      .receive("ok", resp => {
        if (this.props.cryptoReducer.groups[this.room]) {
          console.log(resp)
          this.initializeMessages(resp.messages.messages);
          this.props.updateName(resp.name, resp.color);
          this.getTags(resp.tags.tags);
          const newRequests = {};
          resp.requests.requests.forEach(e => {
            if (!e.encrypted_team_private_key) {
              newRequests[e.uuid] = {uuid: e.uuid, name: e.name, publicKey: e.user_public_key}
            }
          });
          this.setState({
            ...this.state,
            requests: newRequests
          });
          this.syncUsers(resp.requests.requests);
          this.props.newGroupName(this.room, resp.roomName);
        } else {
          this.requestClaimOrInvite();
        }

      }).receive("error", resp => { console.log("Unable to join", resp) });
  }

  receiveMessage(payload) {
    let tags = this.state.tagOptions;
    let postMessage = false;
    payload.tags.forEach((t) => {
      tags = tags.includes(t) ? tags : tags.concat([t]);
      postMessage = postMessage || this.state.tags.includes(t);
    });
    if (this.state.tags.length === 0 || postMessage) {
      const currentMessage = this.props.messageReducer.messages[payload.id]
      if (!currentMessage) {
        this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];
        const options = {
          message: openpgp.message.readArmored(payload.text),     // parse armored message
          privateKeys: [this.privKeyObj]                            // for decryption
        };
        openpgp.decrypt(options).then((plaintext) => {
          const newMessage = {id: payload.id, name: payload.name, text: plaintext.data, color: payload.color, timestamp: moment().format(), tags: payload.tags, uuid: payload.uuid }
          this.props.addMessage(newMessage);
          this.addMessage(newMessage, payload, tags)
        });
      } else {
        this.addMessage(currentMessage, payload, tags)
      }
    }
  }

  addMessage(message, payload, tags) {
    if (!this.state.messageIds.includes(payload.id)) {
      const messageIds = (this.state.messageIds.length === 0 || payload.id > this.state.messageIds[0]) ? [
        ...this.state.messageIds,
        payload.id
      ] : this.state.messageIds
      this.setState({
        ...this.state,
        tagOptions: tags,
        messageIds: messageIds.sort((a, b) => a - b),
        updateType: 'append'
      });
      this.maybeNotify(message);
    } else {
      this.setState({
        ...this.state,
        tagOptions: tags
      })
    }
  }

  async syncUsers(users) {
    const now = moment().format();
    this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];
    await Promise.all(users.map(async (user, i) => {
      if (user.avatar) {
        const options = {
          message: openpgp.message.readArmored(user.avatar),
          privateKeys: [this.privKeyObj]
        };
        const decryption = await openpgp.decrypt(options);
        const decryptedUser = {
          ...user,
          avatar: decryption.data
        }
        this.props.addUser(decryptedUser);
      }
    }));
    this.props.setLastSynced(now);
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

  encryptBlob(blob) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;                
      this.pubKeyObj = this.pubKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].publicKey).keys
      const options = {
        data: base64data,
        publicKeys: this.pubKeyObj,
        armored: true
      };
      openpgp.encrypt(options).then((ciphertext) => {
        this.avatarInput = ciphertext.data;
        this.onModalClose();
      })
    }
    reader.readAsDataURL(blob); 
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
    this.channel && this.channel.leave();
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

  addInitialMessage(messageBody, message) {
    const newMessage = {uuid: m.user.uuid, urlData: m.url_data, id: m.id, name: m.user.name, color: m.user.color, text: decryption.data, timestamp: m.inserted_at, tags: m.tags.map(t => t.name)}
    this.props.addMessage(newMessage);
  }

  async initializeMessages(messages) {
    this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];
    await Promise.all(messages.map(async (m, i) => {
      const cachedMessage = this.cachedMessage(m.id);
      if (!cachedMessage) {
        const options = {
          message: openpgp.message.readArmored(m.body),
          privateKeys: [this.privKeyObj]
        };
        const decryption = await openpgp.decrypt(options)
        const newMessage = {uuid: m.user.uuid, urlData: m.url_data, id: m.id, name: m.user.name, color: m.user.color, text: decryption.data, timestamp: m.inserted_at, tags: m.tags.map(t => t.name)}
        this.props.addMessage(newMessage);
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
      e.preventDefault();
      this.typing = false;
      clearTimeout(this.typeTimeout);
      this.channel.push("new_typing", {uuid: this.props.userReducer.uuid, typing: false});

      if(e.target.value.length > 0 ) {
        if (e.target.value[0] === '#' && !e.target.value.includes(" ")) {
          return this.processTagFromInput(e);
        }
        const message = e.target.value;
        let allTags = this.state.tags.slice(0,1);
        const urls = this.props.userReducer.urlPreviews ? twitter.extractUrls(message).map((url) => url.startsWith('http') ? url : 'https://' + url) : [];
        const extractedTags = twitter.extractHashtags(message);
        extractedTags.forEach((extractedTag) => {
          const downcaseTag = extractedTag.toLowerCase();
          allTags = allTags.includes(downcaseTag) ? allTags : [
            ...allTags,
            downcaseTag
          ]
        })

        this.pubKeyObj = this.pubKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].publicKey).keys
        const options = {
          data: message,
          publicKeys: this.pubKeyObj,
          armored: false
        };

        openpgp.encrypt(options).then((ciphertext) => {
          const encrypted = ciphertext.data;
          this.channel.push("new_msg", {urls: urls, text: encrypted, uuid: this.props.userReducer.uuid, tags: allTags, room: this.room});
        });

        e.target.value = '';
        e.target.style.height = '41px';
      }
    } 
    // else if ((e.key === "Spacebar" || e.key === " ") && e.target.value && e.target.value[0] === '#' && !e.target.value.includes("\w")) {
    //   e.preventDefault();
    //   this.processTagFromInput(e);
    // }
  }

  updateRoomSettings(roomName, urlPreviews) {
    this.channel.push('update_room_name', {team_name: roomName});
    this.props.updateUrlPreviews(urlPreviews);
  }

  processTagFromInput(e) {
    // if (e.target.value[1] === '#') {
    const soleTag = e.target.value.slice(1);
    const newPossibleTags = this.state.tagOptions.includes(soleTag) ? this.state.tagOptions : [
      ...this.state.tagOptions,
      soleTag
    ];
    e.target.value = null;
    return this.pushNewTags([soleTag], newPossibleTags)
    // }

    // const newTag = e.target.value.slice(1);
    // e.target.value = null;
    // const newTags = this.state.tags.includes(newTag) ? this.state.tags : [
    //   ...this.state.tags,
    //   newTag
    // ];
    // const newPossibleTags = this.state.tagOptions.includes(newTag) ? this.state.tagOptions : [
    //   ...this.state.tagOptions,
    //   newTag
    // ];
    // this.pushNewTags(newTags, newPossibleTags);
  }

  clickTag(e) {
    const tag = e.target.text;
    // const newTags = this.state.tags.includes(tag) ? this.state.tags : [
    //   ...this.state.tags,
    //   tag
    // ];
    this.pushNewTags([tag]);
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
    const avatar = this.avatarInput;
    this.channel.push("new_name", {name, color, uuid: this.props.userReducer.uuid, avatar: avatar});
    this.avatarInput = null;
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

          await Promise.all(messages.map(async (m, i) => {
            this.privKeyObj = this.privKeyObj || openpgp.key.readArmored(this.props.cryptoReducer.groups[this.room].privateKey).keys[0];
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
        <Header icon='user circle' content="You don't have access to this group." />
      </Modal>
    )
  }

  handleNewTagOnMessage(e, id) {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = e.target.value.toLowerCase();
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
    if (!this.props.userReducer.token) {
      return ( <Redirect to={`/sign-up?t=${this.room}`} /> )
    }
    if (!this.props.cryptoReducer.publicKey || this.state.generatingGroupKey) {
      return this.renderLoadingKey();
    }
    else if (this.props.userReducer.name && this.props.userReducer.name.length > 1 && !(this.props.cryptoReducer.groups[this.room] &&this.props.cryptoReducer.groups[this.room].privateKey)) {
      return this.renderGate();
    }
    return (
      <div style={{height: '100%', overflow: 'hidden'}}>
        <Nav loggedIn={() => true} navApp={true} presences={this.state.presences} requests={this.state.requests} approveRequest={this.approveRequest} dismissRequest={this.dismissRequest} tags={this.state.tags} tagCounts={this.state.tagCounts} dropdownOptions={this.dropdownOptions} updateTags={this.updateTags} changeName={() => this.setState({...this.state, modalOpen: true})} burnBrowser={this.props.burnBrowser} updateRoomSettings={this.updateRoomSettings} generateUrls={this.props.userReducer.urlPreviews} currentName={this.props.cryptoReducer.groups[this.room] ? this.props.cryptoReducer.groups[this.room].nickname : ''} roomUuid={this.room} groups={this.props.cryptoReducer.groups} />
        <Container style={{height: '100%'}}>
        <div style={this.mainStyles} >
        <UserModal
            modalOpen={this.state.modalOpen}
            name={this.props.userReducer.name}
            colorInput={this.colorInput}
            nameInput={this.nameInput}
            color={this.props.userReducer.color}
            onModalClose={this.onModalClose} 
            encryptBlob={this.encryptBlob} 
            avatarInput={this.avatarInput}
            showAvatar={!!this.props.cryptoReducer.groups[this.room]}
            currentUser={this.props.usersReducer.users[this.props.userReducer.uuid]} />
        <Loader active={this.state.messagesLoading} />
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
            usersReducer={this.props.usersReducer}
            />
            
        <MessageForm
            handleMessage={this.handleMessage} 
            textAreaNode={this.textAreaNode}/>
        </div>
        </Container>
      </div> );
  }
}

const mapStateToProps = (state) => {
  const { userReducer, usersReducer, cryptoReducer, messageReducer } = state;
  return { userReducer, cryptoReducer, messageReducer, usersReducer };
}
const mapDispatchToProps = (dispatch) => {
  return {
    burnBrowser: () => persistor.purge() && dispatch(burnBrowser()),
    setLastSynced: (lastSynced) => dispatch(setLastSynced(lastSynced)),
    addUser: (user) => dispatch(addUser(user)),
    refreshTags: (id, tags) => dispatch(refreshTags(id, tags)),
    newTag: (id, tag) => dispatch(newTag(id, tag)),
    removeTag: (id, tag) => dispatch(removeTag(id, tag)),
    newUrl: (id, urlData, tag) => dispatch(newUrl(id, urlData, tag)),
    addMessage: (message) => dispatch(addMessage(message)),
    updateName: (name, color) => dispatch(updateName(name, color)),
    generateKeypair: () => dispatch(generateKeypair()),
    generateGroupKeypair: (room, name) => dispatch(generateGroupKeypair(room, name)),
    receiveGroupKeypair: (room, publicKey, encryptedPrivateKey, users = [], name = '') => dispatch(receiveGroupKeypair(room, publicKey, encryptedPrivateKey, users, name)),
    updateUrlPreviews: (urlPreviews) => dispatch(updateUrlPreviews(urlPreviews)),
    newGroupName: (room, nickname) => dispatch(newGroupName(room, nickname)),
    expireToken: () => dispatch(expireToken())
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(App);