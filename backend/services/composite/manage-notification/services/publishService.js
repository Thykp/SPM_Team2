const { redis, pushToRedis } = require("./redisPublisher");

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
async function publishAddedToResource( resourceType, resourceId, collaboratorIds, resourceName, resourceDescription, addedBy) {
  const payload = {
    type: "added",
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    resource_description: resourceDescription,
    collaborator_ids: collaboratorIds,
    added_by: addedBy,
    notify_at: Date.now(),
  };

  await pushToRedis("added", payload, payload.notify_at);
}

module.exports = {
  removeDeadlineReminders,
  publishDeadlineReminder,
  publishAddedToResource
};

// /**
//  * Publishes task update notifications.
//  * Removes existing updates for the same task/user to avoid duplicates.
//  */
// async function publishTaskUpdate({ taskId, userIds, status, changedBy, resourceName, priority, projectId = null }) {
//   const payload = {
//     type: "task_update",
//     resource_type: "task",
//     resource_id: taskId,
//     resource_name: resourceName,
//     project_id: projectId,
//     task_priority: priority,
//     user_ids: userIds,
//     status,
//     changed_by: changedBy,
//     notify_at: Date.now(),
//   };

//   await pushToRedis("task_updates", payload, payload.notify_at);
// }
