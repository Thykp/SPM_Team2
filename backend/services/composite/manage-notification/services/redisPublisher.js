const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");


async function pushToRedis(setName, payload, score) {
  await redis.zadd(setName, score, JSON.stringify(payload));
  console.info(`[redis] Pushed to ${setName}:`, payload);
}

module.exports = {
  pushToRedis,
  redis,
};
