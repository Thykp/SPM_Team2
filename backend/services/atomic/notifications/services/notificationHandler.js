const { broadcastToUser } = require("./websocket");
const { postToSupabase } = require("./postSupabase");
const { sendDeadlineOrAddedEmail } = require("./email")
const axios = require("axios");

const NOTIFICATIONS_URL = "http://notifications:4201";
const TASK_URL = "http://task:3031";

// get current user preferences
async function getUserPreferences(userId){
  try {
    const res = await axios.get(`${NOTIFICATIONS_URL}/preferences/delivery-method/${userId}`);
    const prefs = res.data || { email: "", delivery_method: [] };
    console.log(`[getUserPreferences] Current user ${userId} preferences:`, prefs.delivery_method);
    return prefs;
  } catch (err) {
    console.error(`[getUserPreferences] Failed for user ${userId}:`, err.message);
    return { email: "", delivery_method: [] };
  }
}

async function getTaskDetails(taskId){
  try{
    const res = await axios.get(`${TASK_URL}/task/${taskId}`);
    console.log(`[getTaskDetails] Current task ${taskId}:`, res.data)
    return res.data || [];
  } catch (err) {
    console.error(`[getTaskDetails] Failed for user ${taskId}:`, err.message);
    return [];
  }
}

async function processReminderNotification(payload) {
  // await postToSupabase(notifData);

  const { email, delivery_method } = await getUserPreferences(payload.user_id); // { email: "email", delivery_method:[delivery-method]}
  const taskContent = await getTaskDetails(payload.resource_id)

  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");

  const wsPayload = { ...payload, push };
  broadcastToUser(payload.user_id, wsPayload); //TODO: decide the content in the notification
  console.info(taskContent)

  const highPriority = taskContent.priority > 7;
  const mediumPriority = taskContent.priority > 4 && taskContent.priority <= 7;

  const emailPayload = { ...payload,
    email: email,
    isReminder: true,
    task: {
      title: taskContent.title,
      description: taskContent.description,
      deadline: taskContent.deadline,
      project_id: taskContent.project_id,
      priority: taskContent.priority,
      highPriority: highPriority,
      mediumPriority: mediumPriority,
    },
  }

  if (emailPref) {
    sendDeadlineOrAddedEmail(emailPayload)
  }
};

async function processAddedNotification(payload){
  // await postToSupabase(notifData);

  const { email, delivery_method } = await getUserPreferences(payload.user_id); // { email: "email", delivery_method:[delivery-method]}

  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");

  const wsPayload = { ...payload, push };
  broadcastToUser(payload.user_id, wsPayload); //TODO: decide the content in the notification


  const emailPayload = {
    email: email,
    isReminder: false,
    ...payload
  }

  if (emailPref) {
    sendDeadlineOrAddedEmail(emailPayload)
  }
}

/* ---------------- HANDLERS ---------------- */

async function handleDeadlineReminder(payload) {
  if (!payload.user_id) return;
  console.info(`[handler] Deadline reminder → user ${payload.user_id}`);

  await processReminderNotification(payload);
}

async function handleTaskUpdate(payload) {
  if (!Array.isArray(payload.user_ids)) return;
  console.info(`[handler] Task update → users: ${payload.user_ids.join(", ")}`);

  for (const userId of payload.user_ids) {
    const notifData = {
      to_user_id: userId,
      from_user_id: payload.changed_by || null,
      notif_type: "task_update",
      resource_type: "task",
      resource_id: payload.resource_id,
      project_id: payload.project_id || null,
      task_priority: payload.priority || null,
      notif_text: `Task "${payload.resource_name}" was updated to status: ${payload.status}`,
      link_url: `/tasks/${payload.resource_id}`,
    };

    await processNotification(userId, notifData, payload);
  }
}

async function handleAddedToResource(payload) {
  if (!Array.isArray(payload.collaborator_ids)) return;
  console.info(`[handler] Added-to-resource -> users: ${payload.collaborator_ids.join(", ")}`);

  isProject = false
  if (payload.resource_type == "project") isProject = true

  for (const collaborator_id of payload.collaborator_ids) {
    modifiedPayload = { ...payload,
      isProject: isProject,
      user_id: collaborator_id,
      username: payload.added_by,
      notify_at: Date.now(),
    }
    console.info(`[handler] Added-to-resource -> modified payload ${JSON.stringify(modifiedPayload)}`)
    await processAddedNotification(modifiedPayload);
  }
}

module.exports = {
  handleDeadlineReminder,
  handleTaskUpdate,
  handleAddedToResource,
};
