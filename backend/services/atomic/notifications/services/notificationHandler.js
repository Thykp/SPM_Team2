const { broadcastToUser } = require("./websocket");
const { postToSupabase } = require("./postSupabase");
const axios = require("axios");

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notifications:4201";


async function getUserPreferences(userId) {
  try {
    const res = await axios.get(
      `${NOTIFICATION_SERVICE_URL}/notifications/preferences/delivery-method/${userId}`
    );
    return res.data.preferences || [];
  } catch (err) {
    console.error(`[getUserPreferences] Failed for user ${userId}:`, err.message);
    return [];
  }
}


async function processNotification(userId, notifData, payload) {
  await postToSupabase(notifData);

  const prefs = await getUserPreferences(userId);

  const push = prefs.includes("in-app");
  const emailPref = prefs.includes("email");

  const wsPayload = { ...payload, push };
  broadcastToUser(userId, wsPayload);

  if (emailPref) {
    console.info(`[handler] User ${uid} prefers email — email logic pending`);

  }
}

/* ---------------- HANDLERS ---------------- */

async function handleDeadlineReminder(payload) {
  if (!payload.user_id) return;
  console.info(`[handler] Deadline reminder → user ${payload.user_id}`);

  const notifData = {
    to_user_id: payload.user_id,
    from_user_id: payload.from_user_id || null,
    notif_type: "deadline_reminder",
    resource_type: "task",
    resource_id: payload.resource_id,
    project_id: payload.project_id || null,
    task_priority: payload.priority || null,
    notif_text: `Reminder: "${payload.resource_name}" is due in ${payload.reminder_days} day(s).`,
    link_url: `/tasks/${payload.resource_id}`,
  };

  await processNotification(payload.user_id, notifData, payload);
}

async function handleTaskUpdate(payload) {
  if (!Array.isArray(payload.user_ids)) return;
  console.info(`[handler] Task update → users: ${payload.user_ids.join(", ")}`);

  for (const uid of payload.user_ids) {
    const notifData = {
      to_user_id: uid,
      from_user_id: payload.changed_by || null,
      notif_type: "task_update",
      resource_type: "task",
      resource_id: payload.resource_id,
      project_id: payload.project_id || null,
      task_priority: payload.priority || null,
      notif_text: `Task "${payload.resource_name}" was updated to status: ${payload.status}`,
      link_url: `/tasks/${payload.resource_id}`,
    };

    await processNotification(uid, notifData, payload);
  }
}

async function handleAddedToProject(payload) {
  if (!Array.isArray(payload.user_ids)) return;
  console.info(`[handler] Added-to-project → users: ${payload.user_ids.join(", ")}`);

  for (const uid of payload.user_ids) {
    const notifData = {
      to_user_id: uid,
      from_user_id: payload.added_by || null,
      notif_type: "added_to_project",
      resource_type: "project",
      resource_id: payload.resource_id,
      project_id: payload.project_id,
      notif_text: `You were added to project "${payload.resource_name}".`,
      link_url: `/projects/${payload.project_id}`,
    };

    await processNotification(uid, notifData, payload);
  }
}

module.exports = {
  handleDeadlineReminder,
  handleTaskUpdate,
  handleAddedToProject,
};
