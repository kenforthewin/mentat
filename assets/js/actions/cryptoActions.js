let openpgp =  require('openpgp');
import randomWords from 'random-words';

export const generateKeypair = () => {
  return (dispatch, getState) => {
    const passphrase = randomWords({ exactly: 10, join: ' ' })
    const options = {
      userIds: [{ name:'Example Example', email:'example@example.com' }],
      numBits: 2048,
      passphrase: passphrase
    };

    openpgp.generateKey(options).then((key) => {
      const privateKey = key.privateKeyArmored;
      const publicKey = key.publicKeyArmored;
      dispatch({
        type: 'new_key',
        passphrase,
        privateKey,
        publicKey
      });
    });
  }
}

export const generateGroupKeypair = (room) => {
  return (dispatch, getState) => {
    const options = {
      userIds: [{ name:'Example Example', email:'example@example.com' }],
      numBits: 2048,
      passphrase: ''
    };
  
    openpgp.generateKey(options).then((key) => {
      const privateKey = key.privateKeyArmored;
      const publicKey = key.publicKeyArmored;
      return dispatch({
        type: 'new_group_key',
        privateKey,
        publicKey,
        room
      });
    });
  }
}

export const receiveGroupKeypair = (room, publicKey, encryptedPrivateKey) => {
  return (dispatch, getState) => {
    const state = getState();
    var privKeyObj = openpgp.key.readArmored(state.cryptoReducer.privateKey).keys[0];
    privKeyObj.decrypt(state.cryptoReducer.passphrase).then(() => {
      const options = {
        message: openpgp.message.readArmored(encryptedPrivateKey),
        privateKeys: [privKeyObj]
      };
      openpgp.decrypt(options).then((plaintext) => {
        return dispatch({
          type: 'new_group_key',
          privateKey: plaintext.data,
          publicKey,
          room
        });
      });
    });
  }
}