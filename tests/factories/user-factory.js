const mongoose = require('mongoose');
const User = mongoose.model('User');

/**
 * 
 * @returns {Promise} User
 */
module.exports = () => {
  return new User({}).save();
}
