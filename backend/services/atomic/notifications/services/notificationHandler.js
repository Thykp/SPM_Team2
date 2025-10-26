const { broadcastToUser, formatWsAdded, formatWsUpdate, formatWsReminder } = require("./websocket");
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

  const { email, delivery_method } = await getUserPreferences(payload.user_id); // { email: "email", delivery_method:[delivery-method]}
  const taskContent = await getTaskDetails(payload.resource_id)

  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");


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

  const wsPayload = { ...emailPayload, push };
  broadcastPayload = formatWsReminder(wsPayload)
  broadcastToUser(payload.user_id, broadcastPayload); //TODO: decide the content in the notification

  postToSupabase({...broadcastPayload, "user_id": payload.user_id})

  if (emailPref) {
    sendDeadlineOrAddedEmail(emailPayload)
  }
};

async function processAddedNotification(payload){

  const { email, delivery_method } = await getUserPreferences(payload.user_id); // { email: "email", delivery_method:[delivery-method]}

  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");

  let wsPayload = formatWsAdded(payload)
  wsPayload = { ...wsPayload, push };
  broadcastToUser(payload.user_id, wsPayload);
  postToSupabase({...wsPayload, "user_id": payload.user_id})

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
  const allUpdatedTimestamps = [
    ...payload.batched_resources.project.map(p => new Date(p.resource_content.updated.updated_at)),
    ...payload.batched_resources.task.map(t => new Date(t.resource_content.updated.updated_at))
  ];

  // Get the oldest timestamp
  const oldestUpdate = new Date(Math.min(...allUpdatedTimestamps));

  const now = new Date();
  const diffMs = now - oldestUpdate;

  const isImmediate = diffMs < 10 * 60 * 1000; // last 10 minutes
  const isDaily = diffMs < 24 * 60 * 60 * 1000; // last 24 hours
  const isWeekly = diffMs < 7 * 24 * 60 * 60 * 1000; // last 7 days

 try {

  const { email, delivery_method } = await getUserPreferences(payload.user_id); 
  const push = delivery_method.includes("in-app");
  const emailPref = delivery_method.includes("email");
  let wsPayloads = formatWsUpdate(payload)
  wsPayloads.forEach(p => {
    p = {...p, push}
    console.info(`[processUpdateNotifications]: ${JSON.stringify(p)}`)
    broadcastToUser(payload.user_id,p)
    postToSupabase({...p, "user_id": payload.user_id})
  });

  if (emailPref) {
    sendUpdates({
      ...payload,
      email: email,
      isImmediate,
      isDaily,
      isWeekly
    })

    console.log(JSON.stringify({...payload, email}))
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

async function handleUpdate(userId, payloads) {
  // Initialize both resource types
  const batchedResources = {
    project: [],
    task: [],
  };

  for (const payload of payloads) {
    const { update_type, resource_type, resource_id, resource_content, updated_by, original_sent } = payload;

    if (!resource_type || !resource_id) {
      console.warn("[UpdateHandler] Skipping payload with missing resource_type or resource_id:", payload);
      continue;
    }

    batchedResources[resource_type].push({
      update_type,
      resource_id,
      user_id: userId,
      updated_by,
      original_sent : new Date(original_sent).toDateString().replace(" GMT", " (UTC)"),
      resource_content: {
        ...resource_content,
        updated: {
          ...resource_content.updated,
          deadline: new Date(resource_content.updated.deadline).toUTCString().replace(/ GMT.*$/, ' (UTC)')
        },
        original: {
          ...resource_content.original,
          deadline: new Date(resource_content.original.deadline).toUTCString().replace(/ GMT.*$/, ' (UTC)')
        }
      }
    });
  }

  const modifiedPayload = {
    user_id: userId,
    batched_resources: batchedResources,
    hasProject: batchedResources.project.length > 0,
    hasTask: batchedResources.task.length > 0,
  };

  console.log(JSON.stringify(modifiedPayload));
  console.info("[handler] Batched updates:", JSON.stringify(modifiedPayload, null, 2));

  processUpdateNotification(modifiedPayload);
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
    link = `http://localhost:5173/app?taskName=${resource_content.title}`;
  } 
  else if (resource_type === 'task' && resource_id !== 'task') {
    isSubtask = true;
    link = `http://localhost:5173/app`;
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
