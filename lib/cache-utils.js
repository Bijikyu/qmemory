const redis = require('redis');

const createRedisClient = (options = {}) => {
  const clientOptions = {
    host: options.host || process.env.REDIS_HOST || 'localhost',
    port: options.port || process.env.REDIS_PORT || 6379,
    password: options.password || process.env.REDIS_PASSWORD,
    db: options.db || process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    ...options
  };
  
  return redis.createClient(clientOptions);
};

module.exports = { createRedisClient, redis };