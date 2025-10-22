const Redis = require("ioredis");
const redisPub = new Redis(process.env.REDIS_URL || "redis://redis:6379");
const redisSub = new Redis(process.env.REDIS_URL || "redis://redis:6379");
const CHANNEL = "notifications";

async function publishNotification(data) {
  await redisPub.publish(CHANNEL, JSON.stringify(data));
  console.info(`[notifications] Published to ${CHANNEL}:`, data.to_user);
}

function subscribe(channel, callback) {
  redisSub.subscribe(channel, (err) => {
    if (err) console.error("[redis] Subscribe error:", err);
    else console.log(`[redis] Subscribed to ${channel}`);
  });

  redisSub.on("message", (_ch, message) => {
    const parsed = JSON.parse(message);
    callback(parsed);
  });
}

module.exports = { publishNotification, subscribe, CHANNEL };
