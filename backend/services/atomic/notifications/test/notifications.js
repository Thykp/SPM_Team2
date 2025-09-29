// test-notification.js
require("dotenv").config();
const Redis = require("ioredis");

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

// Notification payload
const notification = {
  notif_text: "test message",
  notif_type: "info",
  from_user: "5a10c7c2-7a06-4f2a-9ce4-2948e1fce384",
  to_user: "5a10c7c2-7a06-4f2a-9ce4-2948e1fce384",
  resource_type: "task",
  resource_id: "e9cd9203-e8d2-42fa-a081-b2db6bc443a5",
  project_id: "e9cd9203-e8d2-42fa-a081-b2db6bc443a5",
  priority: "normal",
  delivery_channels: ["in_app"],
  read: false
};

async function sendImmediate() {
  try {
    await redis.publish("notifications", JSON.stringify(notification));
    console.log("✅ Published immediate notification:", notification);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error publishing notification:", err);
    process.exit(1);
  }
}

sendImmediate();
