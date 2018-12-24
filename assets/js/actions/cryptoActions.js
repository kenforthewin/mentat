let openpgp =  require('openpgp');
import randomWords from 'random-words';

export const burnBrowser = () => {
  return {
    type: 'burn_browser'
  }
}

export const approveRequest = (publicKey, encryptedPrivateKey, encryptedPassphrase, requests) => {
  return async (dispatch, getState) => {
    const state = getState();
    var privKeyObj = openpgp.key.readArmored(state.cryptoReducer.privateKey).keys[0];
    await privKeyObj.decrypt(state.cryptoReducer.passphrase)
    const privateKeyOptions = {
      message: openpgp.message.readArmored(encryptedPrivateKey),
      privateKeys: [privKeyObj]
    };
    const privateKey = await openpgp.decrypt(privateKeyOptions)
    const passphraseOptions = {
      message: openpgp.message.readArmored(encryptedPassphrase),
      privateKeys: [privKeyObj]
    };
    const passphrase = await openpgp.decrypt(passphraseOptions)
    const newPrivateKey = privateKey.data
    const newPassphrase = passphrase.data
    dispatch({
      type: 'new_key',
      publicKey,
      privateKey: newPrivateKey,
      passphrase: newPassphrase
    })
    privKeyObj = openpgp.key.readArmored(newPrivateKey).keys[0];
    await privKeyObj.decrypt(newPassphrase)
    requests.requests.forEach(async (request) => {
      const privateGroupKeyOptions = {
        message: openpgp.message.readArmored(request.encrypted_team_private_key),
        privateKeys: [privKeyObj]
      };
      const privateKey = await openpgp.decrypt(privateGroupKeyOptions)
      dispatch({
        type: 'new_group_key',
        room: request.team_name,
        publicKey: request.team_public_key,
        privateKey: privateKey.data,
        name: request.team_nickname
      })
    })
  }
}

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

export const receiveGroupKeypair = (room, publicKey, encryptedPrivateKey, users = [], name = '') => {
  return (dispatch, getState) => {
    const state = getState();
    var privKeyObj = openpgp.key.readArmored(state.cryptoReducer.privateKey).keys[0];
    privKeyObj.decrypt(state.cryptoReducer.passphrase).then(() => {
      const options = {
        message: openpgp.message.readArmored(encryptedPrivateKey),
        privateKeys: [privKeyObj]
      };
      openpgp.decrypt(options).then((plaintext) => {
        dispatch({
          type: 'new_group_key',
          privateKey: plaintext.data,
          publicKey,
          room,
          name
        });
        const groupPrivateKey = openpgp.key.readArmored(plaintext.data).keys[0];
        users.forEach((user) => {
          if (user.avatar) {
            const groupOptions = {
              privateKeys: [groupPrivateKey],
              message: openpgp.message.readArmored(user.avatar)
            }
            openpgp.decrypt(groupOptions).then((plaintext) => {
              const addUser = {
                ...user,
                avatar: plaintext.data
              };
              dispatch({type: 'add_user', user: addUser})
            });
          }
        });
      });
    });
  }
}

export const newGroupName = (room, nickname) => {
  return {
    type: 'new_group_name',
    room,
    nickname
  }
}

export const setGroupPublic = (room) => {
  return {
    type: 'set_public',
    room: room
  }
}