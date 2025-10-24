// THIS IS THE ENTRYPOINT FOR SENDING NOTIFICATIONS

const Redis = require("ioredis");
const {
  handleDeadlineReminder,
  handleUpdate,
  handleAddedToResource,
} = require("./notificationHandler");

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
const POLL_INTERVAL = 5000;

async function pollNotifications(setName) {
  const now = Date.now();

  // Fetch all notifications scheduled up to now
  const notifications = await redis.zrangebyscore(setName, 0, now);
  if (!notifications.length) return;

  console.info(`[poller] Found ${notifications.length} notifications in ${setName}`);

  if (setName === "update") {
    const updatesByUser = {};

    for (const n of notifications) {
      try {
        const payload = JSON.parse(n);

        if (!payload?.type) {
          console.warn("[poller] Skipping invalid payload:", n);
          await redis.zrem(setName, n);
          continue;
        }

        const userId = payload.user_id;
        if (!updatesByUser[userId]) updatesByUser[userId] = [];
        updatesByUser[userId].push({ payload, raw: n });
      } catch (err) {
        console.error("[poller] Failed to parse notification:", err);
      }
    }

    for (const [userId, userUpdates] of Object.entries(updatesByUser)) {
      const payloads = userUpdates.map(u => u.payload);
      try {
        await handleUpdate(payloads);
        console.info(`[poller] Processed ${payloads.length} update(s) for user ${userId}`);
      } catch (err) {
        console.error(`[poller] Failed to process updates for user ${userId}:`, err);
      }

      // Remove all processed items
      for (const u of userUpdates) {
        await redis.zrem(setName, u.raw);
      }
    }

    return;
  }

  for (const n of notifications) {
    try {
      const payload = JSON.parse(n);

      if (!payload?.type) {
        console.warn("[poller] Skipping invalid payload:", n);
        await redis.zrem(setName, n);
        continue;
      }

      console.info(`[poller] Processing ${payload.type} (${payload.resource_type}:${payload.resource_id})`);

      switch (payload.type) {
        case "deadline_reminder":
          await handleDeadlineReminder(payload);
          break;

        case "added":
          await handleAddedToResource(payload);
          break;

        default:
          console.warn("[poller] Unknown notification type:", payload.type);
      }

      // Remove successfully processed notification
      await redis.zrem(setName, n);
    } catch (err) {
      console.error("[poller] Failed to process notification:", err);
    }
  }
}

// ------------
// POLLER START
// ------------
function startPoller() {
  console.info("[poller] Starting Redis poller...");

  setInterval(async () => {
    try {
      await Promise.all([
        pollNotifications("deadline_reminders"),
        pollNotifications("update"),
        pollNotifications("added"),
      ]);
    } catch (err) {
      console.error("[poller] Poll cycle error:", err);
    }
  }, POLL_INTERVAL);
}

module.exports = { startPoller };
