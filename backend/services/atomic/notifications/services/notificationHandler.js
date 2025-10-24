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


  deadline = formatSingaporeDateTime(taskContent.deadline)

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

async function processUpdateNotification(payload){
  // await postToSupabase(notifData);

 try {

  const { email, delivery_method } = await getUserPreferences(payload.user_id); 
  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");

  const wsPayload = Object.assign({}, payload, {
    // update_type: niceUpdateType,
    // push: push,
    // timestamp: Date.now()
  }, resourceFlags);

  broadcastToUser(payload.user_id, wsPayload);


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
    const { update_type, resource_type, resource_id, resource_content, collaboratorIds, updatedBy, user_id  } = payload;

    if (!resource_id) {
      console.warn("[handler] Skipping payload with no resource_id:", payload);
      continue;
    }

    if (!grouped[resource_type]) grouped[resource_type] = {};

    if (!grouped[resource_type][resource_id]) {
      grouped[resource_type][resource_id] = { update_type, user_id, resource_type, resource_id, resource_content, collaboratorIds, updatedBy };
    }
    
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
  console.log(payload);

  const { resource_type, resource_id, resource_content } = payload;

  let isTask = false;
  let isSubtask = false;
  let isProject = false;
  let isProjectTask = false;
  let isProjectSubtask = false;
  let isHighPriority = false;
  let isMediumPriority = false;
  let isLowPriority = false;
  let link = '';

  if (resource_type === 'task' && resource_id === 'task') {
    isTask = true;
    link = 'https://www.youtube.com';
  } 
  else if (resource_type === 'task' && resource_id !== 'task') {
    isSubtask = true;
    link = 'https://www.youtube.com';
  } 
  else if (resource_type === 'project' && !resource_content.project_id && !resource_content.parent) {
    isProject = true;
    link = `http://localhost:5173/app/project/${resource_content.id}`;
  } 
  else if (resource_type === 'project' && resource_content.project_id && !resource_content.parent) {
    isProjectTask = true;
    link = `http://localhost:5173/app/project/${resource_content.project_id}`;
  } 
  else if (resource_type === 'project' && resource_content.project_id && resource_content.parent) {
    isProjectSubtask = true;
    link = `http://localhost:5173/app/project/${resource_content.project_id}`;
  }

  const isTaskLike = isTask || isSubtask || isProjectTask || isProjectSubtask;
  if (isTaskLike && typeof resource_content.priority === 'number') {
    const priority = resource_content.priority;
    if (priority > 7) {
      isHighPriority = true;
    } else if (priority > 4) {
      isMediumPriority = true;
    } else {
      isLowPriority = true;
    }
  }

  for (const user_id of payload.collaborator_ids) {
    const modifiedPayload = {
      ...payload,
      user_id,
      link,
      isTask,
      isSubtask,
      isProject,
      isProjectTask,
      isProjectSubtask,
      isHighPriority,
      isMediumPriority,
      isLowPriority,
    };

    console.info(
      `[handler] Added-to-resource for ${payload.resource_type} -> modified payload: ${JSON.stringify(modifiedPayload)}`
    );

    await processAddedNotification(modifiedPayload);
  }
}


module.exports = {
  handleDeadlineReminder,
  handleUpdate,
  handleAddedToResource,
};
