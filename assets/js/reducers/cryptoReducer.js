const INITIAL_STATE = {
  publicKey: null,
  privateKey: null,
  passphrase: null,
  groups: { }
}

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'new_key':
      return {
        ...state,
        passphrase: action.passphrase,
        privateKey: action.privateKey,
        publicKey: action.publicKey
      }
    case 'new_group_key':
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.room]: {
            privateKey: action.privateKey,
            publicKey: action.publicKey,
            nickname: action.name || ''
          }
        }
      }
    case 'new_group_name':
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.room]: {
            ...state.groups[action.room],
            nickname: action.nickname
          }
        }
      }
    case 'set_public':
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.room]: {
            ...state.groups[action.room],
            public: true
          }
        }
      }
    case 'burn_browser':
      return INITIAL_STATE;
    default:
      return state;
  }
}