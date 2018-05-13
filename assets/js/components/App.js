import React, { Component } from 'react'
import { Segment, Form, TextArea, Container, Comment, Button, Rail, Icon, Dropdown, Label, Header, Modal, Popup, Transition, Item } from 'semantic-ui-react'
import { Socket, Presence } from "phoenix"
import moment from 'moment'
import ChatSegment from './ChatSegment';
import SidebarLeftOverlay from './SidebarLeftOverlay';
import { connect } from 'react-redux';
import {updateName} from '../actions/userActions';
import { Link } from 'react-router-dom';
import ColorPicker from './ColorPicker';
import Huebee from 'huebee';
let openpgp =  require('openpgp');
import { generateKeypair, generateGroupKeypair, receiveGroupKeypair } from '../actions/cryptoActions';

class App extends Component {
  constructor(props) {
    super(props);
    this.typing = false;
    this.state = { messages: [], tags: ['general'], tagOptions: ['general', 'random'], modalOpen: !this.props.userReducer.name || this.props.userReducer.name.length < 1, updateType: 'append', lastMessageLoaded: false, presences: {}, typing: [], requests: {} };

    this.handleMessage = this.handleMessage.bind(this);
    this.initializeMessages = this.initializeMessages.bind(this);
    this.updateTags = this.updateTags.bind(this);
    this.areTagsEmpty = this.areTagsEmpty.bind(this);
    this.textPlaceholder = this.textPlaceholder.bind(this);
    this.dropdownOptions = this.dropdownOptions.bind(this);
    this.getTags = this.getTags.bind(this);
    this.clickTag = this.clickTag.bind(this);
    this.room = props.match.params.room
    this.renderModal = this.renderModal.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.loadMoreMessages = this.loadMoreMessages.bind(this);
    this.renderOnlineUsers = this.renderOnlineUsers.bind(this);
    this.typeTimeoutFn = this.typeTimeoutFn.bind(this);
    this.isTypingLabelVisible = this.isTypingLabelVisible.bind(this);
    this.typingLabelContent = this.typingLabelContent.bind(this);
    this.requestClaimOrInvite = this.requestClaimOrInvite.bind(this);
    this.approveRequest = this.approveRequest.bind(this);

    this.nameInput = React.createRef();
    this.colorInput = React.createRef();

    this.pgpWorkerStarted = openpgp.initWorker({ path:'/js/openpgp.worker.min.js' })

    this.mainStyles = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
    this.formStyles = {
      flex: '0',
      marginBottom: '30px',
      // display: 'flex', 
      // alignItems: 'center',
      height: '100%',
      minHeight: '2.71428571em'
    }
  }

  requestClaimOrInvite() {
    this.channel.push("new_claim_or_invite", {uuid: this.props.userReducer.uuid, name: this.props.userReducer.name, publicKey: this.props.cryptoReducer.publicKey});
  }

  componentDidMount() {
    let socket = new Socket("/socket", {params: {token: window.userToken, uuid: this.props.userReducer.uuid}});
    socket.connect();
    this.channel = socket.channel(`room:${this.room}`, {tags: this.state.tags, uuid: this.props.userReducer.uuid, color: this.props.userReducer.color});

    this.userChannel = socket.channel(`user_room:${this.props.userReducer.uuid}`)

    this.userChannel.on("more_messages", payload => {
      const messages = payload.messages.messages;

      const newMessages = [
        ...messages.reverse().map((m) => { return {id: m.id, name: m.user.name, color: m.user.color, text: m.body, timestamp: m.inserted_at, tags: m.tags.map(t => t.name)} }),
        ...this.state.messages
      ]
      this.setState({
        ...this.state,
        messages: newMessages,
        updateType: 'prepend',
        lastMessageLoaded: messages.length === 0
      })
    })

    this.userChannel.join()
      .receive("ok", resp => {
        if (!this.props.cryptoReducer.publicKey) {
          this.props.generateKeypair(this.requestClaimOrInvite);
        }
        else if (!this.props.cryptoReducer.group.publicKey) {
          this.requestClaimOrInvite();
        }
      })
      .receive("error", resp => {
        console.log(resp)
      });

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
      if (payload.uuid === this.props.userReducer.uuid && !this.props.cryptoReducer.group.publicKey) {
        this.props.receiveGroupKeypair(payload.group_public_key, payload.encrypted_group_private_key);
      }
    });

    this.channel.on("new_claim_or_invite", payload => {
      if (payload.claimed && payload.uuid === this.props.userReducer.uuid) {
        this.props.generateGroupKeypair()
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
      const user = this.state.presences[payload.uuid];
      if (!!user) {
        const name = user.metas[0].name;
        let newTyping;

        if (payload.typing) {
          newTyping = this.state.typing.includes(name) || this.props.userReducer.name === name ? this.state.typing : [
            ...this.state.typing,
            name
          ]
        } else {
          newTyping = this.state.typing.filter(e => e !== name);
        }
        this.setState({
          ...this.state,
          updateType: 'append',
          typing: newTyping
        })
      }
    });

    this.channel.on("new_msg", payload => {
      console.log(payload)
      let tags = this.state.tagOptions;
      let postMessage = false;
      payload.tags.forEach((t) => { 
        tags = tags.includes(t) ? tags : tags.concat([t]);
        postMessage = postMessage || this.state.tags.includes(t);
      });
      if (postMessage) {
        const privKeyObj = openpgp.key.readArmored(this.props.cryptoReducer.group.privateKey).keys[0];
        const options = {
          message: openpgp.message.readArmored(payload.text),     // parse armored message
          privateKeys: [privKeyObj]                            // for decryption
        };
        openpgp.decrypt(options).then((plaintext) => {
          const newMessage = { id: payload.id, name: payload.name, text: plaintext.data, color: payload.color, timestamp: moment().format(), tags: payload.tags }
          this.setState({
            ...this.state,
            tagOptions: tags,
            messages: 
            [
              ...this.state.messages,
              newMessage
            ],
            updateType: 'append'
          });
        });
      }
    });

    this.channel.on("new_tags", payload => {
      if(this.props.userReducer.uuid === payload.uuid) {
        this.setState({
          ...this.state,
          lastMessageLoaded: false
        })
        this.initializeMessages(payload.messages.messages.reverse());
      }
    })

    this.channel.on("get_tags", payload => {
      this.setState({
        ...this.state,
        tagOptions: payload.tags.map(t => t.name)
      })
    })

    this.channel.join()
      .receive("ok", resp => { 
        this.initializeMessages(resp.messages.messages.reverse());
        this.getTags(resp.tags.tags);
        this.props.updateName(resp.name, resp.color);
      }).receive("error", resp => { console.log("Unable to join", resp) });
  }

  componentWillUnmount() {
    this.channel.push("new_typing", {uuid: this.props.userReducer.uuid, typing: false});
  }

  getTags(tags) {
    this.setState({
      ...this.state,
      tagOptions: tags.map(t => t.name)
    })
  }

  initializeMessages(messages) {
    this.setState({
      ...this.state,
      messages: messages.map((m) => { return {id: m.id, name: m.user.name, text: m.body, timestamp: m.inserted_at, color: m.user.color, tags: m.tags.map(t => t.name)} }),
      updateType: 'append'
    });
  }

  typeTimeoutFn() {
    this.typing = false;
    this.channel.push("new_typing", {uuid: this.props.userReducer.uuid, typing: false});
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

      if(e.target.value.length > 0 && this.state.tags.length > 0) {
        const message = e.target.value;
        const options = {
          data: message,
          publicKeys: openpgp.key.readArmored(this.props.cryptoReducer.group.publicKey).keys
        };
        openpgp.encrypt(options).then((ciphertext) => {
          const encrypted = ciphertext.data;
          this.channel.push("new_msg", {text: encrypted, uuid: this.props.userReducer.uuid, tags: this.state.tags, room: this.room});
        });
        e.target.value = '';
      }
    } else if ((e.key === "Spacebar" || e.key === " ") && e.target.value && e.target.value[0] === '#') {
      e.preventDefault();
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
      this.setState({
        ...this.state,
        tags: newTags,
        tagOptions: newPossibleTags
      });
      this.channel.push("new_tags", {tags: newTags, room: this.room});
    }
  }

  clickTag(e) {
    const tag = e.target.text;
    const newTags = this.state.tags.includes(tag) ? this.state.tags : [
      ...this.state.tags,
      tag
    ];
    this.setState({
      ...this.state,
      tags: newTags
    });
    this.channel.push("new_tags", {tags: newTags, room: this.room});
  }

  updateTags(e, data) {
    this.setState({
      ...this.state,
      tags: data.value
    });
    this.channel.push("new_tags", {tags: data.value, room: this.room, uuid: this.props.userReducer.uuid});
  }

  areTagsEmpty() {
    return this.state.tags.length === 0;
  }

  textPlaceholder() {
    if (this.areTagsEmpty()) {
      return 'Select a tag';
    }
    return 'Type your message';
  }

  dropdownOptions() {
    return this.state.tagOptions.map(t => { return({text: t, value: t});});
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
    this.channel.push("new_tags", {tags: this.state.tags, room: this.room});
  }

  loadMoreMessages() {
    const id = this.state.messages[0].id;
    this.userChannel.push("more_messages", {id, tags: this.state.tags, room: this.room});
  }

  renderModal() {
    return (
      <Modal basic open={this.state.modalOpen} closeOnDimmerClick={false} size='small'>
        <Header icon='user circle' content='Set name and preferred color' />
        <Modal.Content>
          <Form>
            <Form.Field>
              <input placeholder='Username' defaultValue={this.props.userReducer.name} ref={this.nameInput}/>
            </Form.Field>
            <ColorPicker color={this.props.userReducer.color} inputRef={this.colorInput}/>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' onClick={this.onModalClose} inverted>
            <Icon name='checkmark' /> Accept
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  renderOnlineUsers() {
    const users = this.state.presences;

    return Object.values(users).map((u, i) => {
      const metas = u.metas[0]
      return (
        <Dropdown.Item label={{ empty: true, circular: true, style: {backgroundColor: metas.color} }} text={metas.name} key={i} />
      )
    })
  }

  approveRequest(e) {
    const data = e.target.dataset;

    const options = {
      data: this.props.cryptoReducer.group.privateKey,
      publicKeys: openpgp.key.readArmored(data.publicKey).keys
    };
    openpgp.encrypt(options).then((ciphertext) => {
      const encrypted = ciphertext.data;
      this.channel.push("approve_request", { uuid: data.uuid, groupPublicKey: this.props.cryptoReducer.group.publicKey, encryptedGroupPrivateKey: encrypted})
    });
  }

  renderRequests() {
    const requests = this.state.requests;

    return Object.values(requests).map((r, i) => {
      return (
        <Dropdown.Item key={i} >
          <Form size='mini'>
            <Form.Group inline >
              <Item content={r.name} style={{ marginRight: '10px' }}/>
              <Button size='mini' onClick={this.approveRequest} data-uuid={r.uuid} data-public-key={r.publicKey} compact>Yes</Button>
              <Button size='mini' compact>No</Button>
            </Form.Group>
          </Form>
        </Dropdown.Item>
      );
    });
  }

  isTypingLabelVisible() {
    const thoseTyping = this.state.typing;

    return thoseTyping.length > 0;
  }

  typingLabelContent() {
    if (!this.isTypingLabelVisible()) {
      return '';
    }
    const thoseTyping = this.state.typing;
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

  render() {
    if (this.props.userReducer.name && this.props.userReducer.name.length > 1 && !this.props.cryptoReducer.group.publicKey) {
      return this.renderGate();
    }
    return (
      <div style={this.mainStyles}>
        {this.renderModal()}
        <div style={{flex: 0, display: 'flex', minHeight: '2.71428571em', alignItems: 'center'}}>
            <Dropdown icon='users' size='large' style={{flex: 0, marginRight: '10px'}} direction='right'>
            <Dropdown.Menu>
              <Dropdown.Header content='Online Now' />
              <Dropdown.Divider />
              {this.renderOnlineUsers()}
              <Dropdown.Header content='Requests' />
              <Dropdown.Divider />
              {this.renderRequests()}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown multiple search selection closeOnChange options={this.dropdownOptions()} placeholder='Select a tag' value={this.state.tags} style={{ flex: 1, marginRight: '10px' }} onChange={this.updateTags}/>
          <Dropdown icon='options' size='large' style={{flex: 0}} direction='left'>
            <Dropdown.Menu>
              <Dropdown.Item text='Change name' onClick={() => this.setState({...this.state, modalOpen: true})}/>
              <Dropdown.Divider />
              <Dropdown.Item text='Exit to main menu' as={Link} to='/' />
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <ChatSegment messages={this.state.messages} lastMessageLoaded={this.state.lastMessageLoaded} onTagClick={this.clickTag} style={{ flex: '1 0', height: '100%'}} loadMoreMessages={this.loadMoreMessages} updateType={this.state.updateType} typingLabelVisible={this.isTypingLabelVisible()} typingLabelContent={this.typingLabelContent()}/>

        <Form style={this.formStyles}>

          <TextArea autoHeight rows={1} 
            placeholder={this.textPlaceholder()} 
            onKeyPress={this.handleMessage} 
            disabled={this.areTagsEmpty()}
            />
        </Form>
      </div> );
  }
}
const mapStateToProps = (state) => {
  const { userReducer, cryptoReducer } = state;
  return { userReducer, cryptoReducer };
}
const mapDispatchToProps = (dispatch) => {
  return {
    updateName: (name, color) => dispatch(updateName(name, color)),
    generateKeypair: (afterGenerateFn) => dispatch(generateKeypair(afterGenerateFn)),
    generateGroupKeypair: () => dispatch(generateGroupKeypair()),
    receiveGroupKeypair: (publicKey, encryptedPrivateKey) => dispatch(receiveGroupKeypair(publicKey, encryptedPrivateKey))
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(App);