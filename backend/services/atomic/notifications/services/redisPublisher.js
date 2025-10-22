const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CHANNEL = "notifications";

async function publishNotification(data) {
  await redis.publish(CHANNEL, JSON.stringify(data));
  console.info(`[notifications] Sent to ${data.to_user}`);
}

module.exports = { publishNotification, redis };
