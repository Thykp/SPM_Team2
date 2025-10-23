const { redis, pushToRedis } = require("./redisPublisher");

/**
 * Compute the next notify_at timestamp based on frequency
 * frequency = {
 *   delivery_frequency: 'immediate' | 'daily' | 'weekly',
 *   delivery_time: '1970-01-01T09:00:00+00:00',
 *   delivery_day: 'Monday' | 'Tuesday' | ...
 * }
 */
function computeNextNotifyAt(frequency) {
  const now = new Date();

  switch (frequency.delivery_frequency) {
    case "Immediate":
      return new Date().getTime();

    case "Daily": {
      const time = frequency.delivery_time || "1970-01-01T09:00:00+00:00";
      const date = new Date(time);
      if (isNaN(date.getTime())) throw new Error("Invalid delivery_time format for Daily");

      const next = new Date(now);
      next.setHours(date.getUTCHours(), date.getUTCMinutes(), 0, 0);

      if (next <= now) next.setDate(next.getDate() + 1);
      return next.getTime();
    }

    case "Weekly": {
      const time = frequency.delivery_time || "1970-01-01T09:00:00+00:00";
      const date = new Date(time);
      if (isNaN(date.getTime())) throw new Error("Invalid delivery_time format for Weekly");

      const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const targetDay = daysOfWeek.indexOf(frequency.delivery_day || "Monday");
      if (targetDay === -1) throw new Error("Invalid delivery_day for Weekly frequency");

      const next = new Date(now);
      next.setHours(date.getUTCHours(), date.getUTCMinutes(), 0, 0);

      const dayDiff = (targetDay + 7 - next.getDay()) % 7;
      if (dayDiff === 0 && next <= now) {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + dayDiff);
      }

      return next.getTime();
    }

    default:
      throw new Error("Invalid delivery_frequency");
  }
}


/**
 * Update all notifications for a user according to their new frequency
 */
async function updateUserNotifications(userId, frequency) {
  try {
    console.info("[updateUserNotifications] Attempting to reschedule notifications for " + userId);

    const items = await redis.zrangebyscore("update", "-inf", "+inf");

    for (const item of items) {
      try {
        const payload = JSON.parse(item);
        if (payload.user_id !== userId) continue;
        const newNotifyAt = computeNextNotifyAt(frequency);
        await redis.zrem("update", item);
        const updatedPayload = { ...payload, notify_at: newNotifyAt };
        await pushToRedis("update", updatedPayload, newNotifyAt);

        console.info(
          `[updateUserNotifications] Updated notification for ${userId} to ${new Date(newNotifyAt).toISOString()}`
        );

      } catch (err) {
        console.warn("[updateUserNotifications] Failed to parse Redis item", err, item);
      }
    }
  } catch (err) {
    console.error("[updateUserNotifications] Failed to update notifications:", err);
  }
}


/**
 * Remove all deadline reminders for a given task and user
 */
async function removeDeadlineReminders(taskId, userId) {
  try {
    const items = await redis.zrangebyscore("deadline_reminders", "-inf", "+inf");

    for (const item of items) {
      try {
        const payload = JSON.parse(item);

        if (
          payload.type === "deadline_reminder" &&
          payload.resource_id === taskId &&
          payload.user_id === userId
        ) {
          await redis.zrem("deadline_reminders", item);
          console.info(`[removeDeadlineReminders] Removed ${taskId}:${userId} (day: ${payload.day})`);
        }
      } catch (err) {
        console.warn("[removeDeadlineReminders] Failed to parse Redis item", err);
      }
    }
  } catch (err) {
    console.error("[removeDeadlineReminders] Error removing reminders from Redis:", err);
  }
}

/**
 * Publish deadline reminder notifications for a task.
 * Each reminder corresponds to a specific day before the deadline.
 */
async function publishDeadlineReminder({ taskId, userId, deadline, reminderDays = [1, 3, 7], username }) {
  if (!deadline) {
    console.error("[publishDeadlineReminder] Missing deadline");
    return;
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    console.error(`[publishDeadlineReminder] Invalid deadline: ${deadline}`);
    return;
  }

  await removeDeadlineReminders(taskId, userId);

  for (const day of reminderDays) {
    const notifyAt = deadlineDate.getTime() - day * 24 * 60 * 60 * 1000;

    const payload = {
      type: "deadline_reminder",
      resource_type: "task",
      resource_id: taskId,
      user_id: userId,
      username: username,
      day,
      notify_at: notifyAt,
      key: `${taskId}:${userId}:${day}`,
    };

    try {
      await pushToRedis("deadline_reminders", payload, notifyAt);
      console.info(`[publishDeadlineReminder] Pushed reminder for ${taskId}:${userId} (day: ${day})`);
    } catch (err) {
      console.error(`[publishDeadlineReminder] Failed to push reminder for ${taskId}:${userId} (day: ${day})`, err);
    }
  }
}

/**
 * Publishes resource-collaboration notifications.
 * since delivered immediately, no need to remove from notifications
 */
async function publishAddedToResource( resourceType, resourceId, collaboratorIds, resourceName, resourceDescription, addedBy, priority ) {
  const payload = {
    type: "added", 
    //can be task, project, project-task, project-task-subtask
    resource_type: resourceType,
    // for task, there is no task_id. if project-task, resource_id is project_id. if project, resource_id is project_id. if subtask, resource_id is task_id
    resource_id: resourceId,
    resource_name: resourceName,
    resource_description: resourceDescription,
    collaborator_ids: collaboratorIds,
    added_by: addedBy,
    // only for if its a task, which has priority (default to 10 if needed)
    priority: priority | 10,
    notify_at: Date.now(),
  };

  await pushToRedis("added", payload, payload.notify_at);
}

/**
 * Publishes update notifications.
 * logic to update existing frequency is above (updateUserNotifications)
 */
async function publishUpdate( updateType, resourceType, resourceContent, userId, notifyAt, updatedBy ) {
    const payload = {
      type: "update",
      update_type: updateType,
      resource_type: resourceType,
      resource_content: resourceContent,
      user_id: userId,
      updated_by: updatedBy,
      notify_at: notifyAt,
      original_sent: Date.now(),
    }
    await pushToRedis("update", payload, payload.notify_at);
  }


module.exports = {
  removeDeadlineReminders,
  publishDeadlineReminder,
  publishAddedToResource,
  updateUserNotifications,
  publishUpdate,
  computeNextNotifyAt
};

