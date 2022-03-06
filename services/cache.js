const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

/**
 * adds .cache() to Query
 * example await Blog.find({ user: id }).cache({ key: user.id })
 * 
 * sets this.useCache to true
 * returns this to make chainable (ie .find().cache().limit() etc)
 * @param {Object} options.key top level cache key
 */
mongoose.Query.prototype.cache = function (options = {}) {
  this.hashKey = JSON.stringify(options.key || 'default')
  this.useCache = true;
  return this;
}

mongoose.Query.prototype.exec = async function () {
  // if cache() is not applied
  // apply the query without caching
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // create redis key ie { user: id, collection: 'blogs' }
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name,
  }));

  // attempt to get the cached value from redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if cacheValue parse json
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    // return a new model for each parsed document
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // if no cachedValue apply the query
  const result = await exec.apply(this, arguments);

  // set the result of the query in redis set expiration
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

  // return the result of the query
  return result;
}

module.exports = {
  /**
   * delete stored information by hashkey
   * @param {string} hashKey 
   */
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}
