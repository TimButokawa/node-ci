const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

/**
 * 
 * @param {Model} user
 * @returns session signature, and session
 */
module.exports = (user) => {
  const sessionObject = {
    passport: {
      user: user._id.toString(),
    }
  };
  // create session from sessionObject
  const session = Buffer
    .from(JSON.stringify(sessionObject))
    .toString('base64');
  // sign our session
  const sig = keygrip.sign(`session=${session}`);

  return {
    sig,
    session,
  }
}
