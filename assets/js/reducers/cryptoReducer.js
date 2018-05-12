const INITIAL_STATE = {
  publicKey: null,
  privateKey: null,
  passphrase: null
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
    default:
      return state;
  }
}