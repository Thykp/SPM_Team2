const { pushToRedis, redis } = require("./redisPublisher");

/**
 * Remove all notifications from a Redis sorted set for a given type, resource_id, and user_id.
 */
async function removeDeadlineReminders(taskId, userId) {
  try {
    const items = await redis.zrangebyscore("deadline_reminders", "-inf", "+inf");
    for (const item of items) {
      try {
        const payload = JSON.parse(item);
        if (payload.type === "deadline_reminder" &&
            payload.resource_id === taskId &&
            payload.user_id === userId) {
          await redis.zrem("deadline_reminders", item);
          console.info(`[removeDeadlineReminders] Removed ${taskId}:${userId}`);
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
 * Publishes deadline reminder notifications for a given task.
 */
async function publishDeadlineReminder({taskId, userId, deadline, priority, resourceName, reminderDays = [1, 3, 7]}) {
  if (!deadline) {
    console.error("[publishDeadlineReminder] Missing deadline");
    return;
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    console.error(`[publishDeadlineReminder] Invalid deadline: ${deadline}`);
    return;
  }

  // Remove existing reminders first
  await removeDeadlineReminders(taskId, userId);

  // Publish new reminders
  for (const days of reminderDays) {
    const notifyAt = deadlineDate.getTime() - days * 24 * 60 * 60 * 1000;

    const payload = {
      type: "deadline_reminder",
      resource_type: "task",
      resource_id: taskId,
      resource_name: resourceName,
      user_id: userId,
      task_priority: priority,
      reminder_days: days,
      notify_at: notifyAt,
    };

    try {
      await pushToRedis("deadline_reminders", payload, notifyAt);
      console.info(`[publishDeadlineReminder] Pushed reminder for ${taskId}:${userId} (days: ${days})`);
    } catch (err) {
      console.error(`[publishDeadlineReminder] Failed to push reminder for ${taskId}:${userId}`, err);
    }
  }
}

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

// /**
//  * Publishes project-collaboration notifications.
//  * Removes existing notifications for the same project/user to avoid duplicates.
//  */
// async function publishAddedToProject({ projectId, userIds, addedBy, resourceName, collaborators }) {
//   const payload = {
//     type: "added_to_project",
//     resource_type: "project",
//     resource_id: projectId,
//     resource_name: resourceName,
//     user_ids: userIds,
//     project_collaborators: collaborators,
//     added_by: addedBy,
//     notify_at: Date.now(),
//   };

//   await pushToRedis("project_updates", payload, payload.notify_at);
// }

module.exports = {
  publishDeadlineReminder,
  // publishTaskUpdate,
  // publishAddedToProject,
};
