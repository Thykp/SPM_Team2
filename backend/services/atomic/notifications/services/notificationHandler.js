const { broadcastToUser } = require("./websocket");
const { postToSupabase } = require("./postSupabase");
const { sendDeadlineOrAddedEmail, sendUpdates  } = require("./email")
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

  const highPriority = taskContent.priority > 7;
  const mediumPriority = taskContent.priority > 4 && taskContent.priority <= 7;

  function formatSingaporeDateTime(isoTimestamp) {
  const date = new Date(isoTimestamp);

  return date.toLocaleString("en-US", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    });
  }


  deadline = formatLocalDateTime(taskContent.deadline)

  const emailPayload = { ...payload,
    email: email,
    isReminder: true,
    task: {
      title: taskContent.title,
      description: taskContent.description,
      status: taskContent.status,
      deadline: deadline,
      project_id: taskContent.project_id,
      priority: taskContent.priority,
      highPriority: highPriority,
      mediumPriority: mediumPriority,
    },
  }

  if (emailPref) {
    // sendDeadlineOrAddedEmail(emailPayload)
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
    // sendDeadlineOrAddedEmail(emailPayload)
  }
}

async function processUpdateNotification(payload){
  // await postToSupabase(notifData);

 try {
  const resourceNiceNames = {
    project: "Project",
    "project-task": "Project Task",
    "project-subtask": "Project Subtask",
    subtask: "Subtask",
    task: "Task",
  };

  const resourceFlags = {
    isProject: payload.resource_type === "project",
    isProjectTask: payload.resource_type === "project-task",
    isProjectSubtask: payload.resource_type === "project-subtask",
    isSubtask: payload.resource_type === "subtask",
    isTask: payload.resource_type === "task",
  };

  const niceUpdateType = `${resourceNiceNames[payload.resource_type] || payload.resource_type} ${payload.update_type}`;

  const { email, delivery_method } = await getUserPreferences(payload.user_id); 
  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");

  const wsPayload = Object.assign({}, payload, {
    update_type: niceUpdateType,
    push: push,
    timestamp: Date.now()
  }, resourceFlags);

  broadcastToUser(payload.user_id, wsPayload);


  const emailPayload = {
    email: email,
    ...payload,
    update_type: niceUpdateType,
  }

  if (emailPref) {
    sendUpdates(emailPayload)
  } 
  } catch (err){
    console.error("[processUpdateNotification] Failed:", err);
  }
}

/* ---------------- HANDLERS ---------------- */

async function handleDeadlineReminder(payload) {
  if (!payload.user_id) return;
  console.info(`[handler] Deadline reminder → user ${payload.user_id}`);

  await processReminderNotification(payload);
}

async function handleUpdate(payloads) {
  console.info(`[handler] Received ${payloads.length} update(s)`);

  const grouped = {};

  for (const payload of payloads) {
    const { resource_type, resource_content, resource_id = resource_content?.taskId || resource_content?.id, user_id, updated_by, update_type } = payload;

    if (!resource_id) {
      console.warn("[handler] Skipping payload with no resource_id:", payload);
      continue;
    }

    if (!grouped[resource_type]) grouped[resource_type] = {};

    if (!grouped[resource_type][resource_id]) {
      grouped[resource_type][resource_id] = {
        resource_type,
        resource_id,
        update_type,
        user_id,
        updated_by,
        resource_contents: []
      };
    }

    // Push the resource_content into the group's array
    grouped[resource_type][resource_id].resource_contents.push(resource_content);

    processUpdateNotification(payload)
  }

  // Convert each resource_type map to an array
  const result = {};
  for (const rType of Object.keys(grouped)) {
    result[rType] = Object.values(grouped[rType]);
  }

  console.info("[handler] Grouped updates:", JSON.stringify(result, null, 2));
  return result;
}

async function handleAddedToResource(payload) {
  if (!Array.isArray(payload.collaborator_ids)) return;
  console.info(`[handler] Added-to-resource -> users: ${payload.collaborator_ids.join(", ")}`);

  // for project: handle if is a project or project-task
  isProject = false
  isProjectTask = false
  if (payload.resource_type == "project") isProject = true
  if (payload.resource_type == "project-task") isProject = true

  for (const collaborator_id of payload.collaborator_ids) {

    // for project: clickable link to open up to that project
    modifiedPayload = { ...payload,
      isProject: isProject,
      isProjectTask: isProjectTask,
      link: "http://localhost:5173/app/project/" + payload.resource_id,
      user_id: collaborator_id,
      username: payload.added_by,
      notify_at: Date.now(),
    }
    
    console.info(`[handler] Added-to-resource for ${modifiedPayload.resource_type}-> modified payload ${JSON.stringify(modifiedPayload)}`)
    await processAddedNotification(modifiedPayload);
  }
}

module.exports = {
  handleDeadlineReminder,
  handleUpdate,
  handleAddedToResource,
};
