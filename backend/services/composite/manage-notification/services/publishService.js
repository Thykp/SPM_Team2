const { pushToRedis } = require("./redisPublisher");

/**
 * Publishes deadline reminder notifications for a given task.
 * @param {Object} params
 * @param {String} params.taskId - Task UUID
 * @param {String} params.userId - Target user ID
 * @param {String} params.deadline - Task deadline (ISO string)
 * @param {Number} params.priority - Task priority (1–10)
 * @param {String} params.resourceName - Task title or name
 * @param {Array<Number>} [params.reminderDays=[1,3,7]] - Days before deadline to notify
 */
async function publishDeadlineReminder({
  taskId,
  userId,
  deadline,
  priority,
  resourceName,
  reminderDays = [1, 3, 7],
}) {
  if (!deadline) {
    console.error("[publishDeadlineReminder] Missing deadline");
    return;
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    console.error(`[publishDeadlineReminder] Invalid deadline: ${deadline}`);
    return;
  }

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

    await pushToRedis("deadline_reminders", payload, notifyAt);
    console.info(`[publishDeadlineReminder] Pushed notification for user ${userId} (notify in ${days} days)`);
  }
}


/**
 * Publishes task update notifications.
 * @param {Object} params
 * @param {String} params.taskId - Task UUID
 * @param {Array<String>} params.userIds - List of affected users
 * @param {String} params.status - Updated status (e.g. 'completed', 'in_progress')
 * @param {String} params.changedBy - User ID who made the change
 * @param {String} params.resourceName - Task title
 * @param {Number} params.priority - Task priority
 * @param {String} params.projectId - Optional related project ID
 */
async function publishTaskUpdate({
  taskId,
  userIds,
  status,
  changedBy,
  resourceName,
  priority,
  projectId = null,
}) {
  const payload = {
    type: "task_update",
    resource_type: "task",
    resource_id: taskId,
    resource_name: resourceName,
    project_id: projectId,
    task_priority: priority,
    user_ids: userIds,
    status,
    changed_by: changedBy,
    notify_at: Date.now(),
  };

  await pushToRedis("task_updates", payload, payload.notify_at);
}

/**
 * Publishes project-collaboration notifications.
 * @param {Object} params
 * @param {String} params.projectId - Project UUID
 * @param {Array<String>} params.userIds - Newly added users
 * @param {String} params.addedBy - Who added them
 * @param {String} params.resourceName - Project name
 * @param {Array<String>} params.collaborators - Full list of collaborators
 */
async function publishAddedToProject({
  projectId,
  userIds,
  addedBy,
  resourceName,
  collaborators,
}) {
  const payload = {
    type: "added_to_project",
    resource_type: "project",
    resource_id: projectId,
    resource_name: resourceName,
    user_ids: userIds,
    project_collaborators: collaborators,
    added_by: addedBy,
    notify_at: Date.now(),
  };

  await pushToRedis("project_updates", payload, payload.notify_at);
}

module.exports = {
  publishDeadlineReminder,
  publishTaskUpdate,
  publishAddedToProject,
};
