const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  // after route handler
  await next();

  // clear redis cache for this user after
  // route handler has run
  clearHash(req.user.id);
}
