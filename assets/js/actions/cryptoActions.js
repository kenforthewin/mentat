import openpgp from 'openpgp';
import randomWords from 'random-words';

export const generateKeypair = () => {
  return (dispatch, getState) => {
    const passphrase = randomWords({ exactly: 10, join: ' ' })
    const options = {
      userIds: [{ name:'Example Example', email:'example@example.com' }],
      numBits: 4096,
      passphrase: passphrase
    };

    openpgp.generateKey(options).then((key) => {
      const privateKey = key.privateKeyArmored;
      const publicKey = key.publicKeyArmored;
      return dispatch({
        type: 'new_key',
        passphrase,
        privateKey,
        publicKey
      });
    });
  }
}