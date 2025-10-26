const { WebSocketServer } = require("ws");

const clients = new Map(); // Map<userId, Set<WebSocket>>

function addClient(userId, ws) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(ws);

  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  ws.on("close", () => {
    clients.get(userId).delete(ws);
    if (clients.get(userId).size === 0) clients.delete(userId);
    console.log(`[ws] Disconnected: ${userId}`);
  });
}

function broadcastToUser(userId, message) {
  const sockets = clients.get(userId);
  if (!sockets) return;

  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
  }
  console.log(`[ws] Sent notification to ${userId}`);
}

function initWebSocketServer(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    try {
      // Parse userId from query string
      const params = new URLSearchParams(req.url.split("?")[1]);
      const userId = params.get("userId");

      if (!userId) {
        console.log("[ws] Missing userId, closing connection");
        return ws.close();
      }

      addClient(userId, ws);
      console.log(`[ws] Connected: ${userId}`);
    } catch (err) {
      console.error("[ws] Connection error:", err);
      ws.close();
    }
  });

  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log("[ws] Terminating dead connection");
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

function formatWsAdded(payload) {
  let resourceLabel = '';
  if (payload.isSubtask) resourceLabel = 'Sub Task';
  else if (payload.isTask) resourceLabel = 'Task';
  else if (payload.isProject) resourceLabel = 'Project';
  else if (payload.isProjectTask) resourceLabel = 'Project Task';
  else if (payload.isProjectSubtask) resourceLabel = 'Project Subtask';
  else resourceLabel = payload.resource_type;

  let priority = '';
  if (payload.isTask || payload.isProjectTask || payload.isProjectSubtask) {
    if (payload.isHighPriority) priority = '[High]';
    else if (payload.isMediumPriority) priority = '[Medium]';
    else if (payload.isLowPriority) priority = '[Low]';
  }

  let description = ""
  if (payload.resource_content.status) description += ` (${payload.resource_content.status})`
  
  description += `${payload.addedBy} has added you to ${payload.resource_content.title || payload.resource_content.id} to collaborate.`;


  const notificationId = crypto.randomUUID();; 

  console.info(`[FormatWsAdded]: ${JSON.stringify({ title: `Added to ${resourceLabel}: ${payload.resource_content.title || payload.resource_content.id}`,
    description,
    link: payload.link, })}`);

  return {
    id: notificationId,
    title: `${priority} Added to ${resourceLabel}: ${payload.resource_content.title || payload.resource_content.id}`,
    description,
    link: payload.link,
  };
}





function formatWsUpdate(batchedResources) {
  const wsNotifications = [];

  // Process Projects
  if (batchedResources.batched_resources.project){
    (batchedResources.batched_resources.project).forEach((proj) => {
      const updated = proj.resource_content.updated;
      const notificationId = crypto.randomUUID();
      let title = ""
      let link = ""

      if (updated.deadline == "Invalid Date"){
        title = `Project ${updated.title} ${proj.update_type} by ${proj.updated_by}`
        link = `/app/project/${updated.id}`
      } else if (updated.parent == null){
        title = `Project Task ${updated.title} ${proj.update_type} by ${proj.updated_by}`
        link = `/app/project/${updated.project_id}`
      } else if (updated.parent){
        title = `Project Subtask ${updated.title} ${proj.update_type} by ${proj.updated_by}`
        link = `/app/project/${updated.project_id}`
      }

      wsNotifications.push({
        id: notificationId,
        title: title,
        link: link,
        description: `Description: "${updated.description || ''}".`
      });
    });
  }

  // Process Tasks
  if(batchedResources.batched_resources.task){
    batchedResources.batched_resources.task.forEach((task) => {
      const updated = task.resource_content.updated;
      const notificationId = crypto.randomUUID();

      let titlePrefix;
      if (updated.parent == null) {
        titlePrefix = `Task ${updated.title} ${task.update_type} by: ${task.updated_by}`;
      } else {
        titlePrefix = `Subtask ${updated.title} ${task.update_type} by: ${task.updated_by}`;  
      }

      const link = `/app?taskName=${updated.title}`;

      const description = `(${updated.status || 'N/A'})`;

      wsNotifications.push({
        id: notificationId,
        title: titlePrefix,
        link,
        description
      });
    });
  }

  console.log(`[FormatWsUpdate]: ${JSON.stringify(wsNotifications)}`);

  return wsNotifications;
}



function formatWsReminder(wsPayload) {
  if (!wsPayload || !wsPayload.task) return null;

  const task = wsPayload.task;

  const notificationId = crypto.randomUUID();

  const link = task.project_id
    ? `/app/project/${task.project_id}`
    : `/app?taskName=${wsPayload.resource_content.title}`;

  // Construct title
  const title = `Upcoming Deadline: ${task.title}`;

  const description = `Reminder set for ${wsPayload.day} day(s) before deadline. ` +
    `Status: ${task.status || 'N/A'}, Priority: ${task.priority || 'N/A'}. ` +
    `${task.description ? `Description: "${task.description}"` : ''}`;

  console.info(`[FormatWsReminder]: ${JSON.stringify({ title, link, description })}`);

  return {
    id: notificationId,  
    title,
    link,
    description
  };
}



module.exports = { initWebSocketServer, broadcastToUser, formatWsAdded, formatWsUpdate, formatWsReminder };
