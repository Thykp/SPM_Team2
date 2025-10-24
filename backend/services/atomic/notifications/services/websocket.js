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
  if (payload.isTask) resourceLabel = 'Task';
  else if (payload.isProject) resourceLabel = 'Project';
  else if (payload.isProjectTask) resourceLabel = 'Project Task';
  else if (payload.isProjectSubtask) resourceLabel = 'Project Subtask';
  else resourceLabel = payload.resource_type;

  let priority = '';
  if (payload.isTask || payload.isProjectTask || payload.isProjectSubtask) {
    if (payload.isHighPriority) priority = 'High';
    else if (payload.isMediumPriority) priority = 'Medium';
    else if (payload.isLowPriority) priority = 'Low';
  }

  let description = `Added by ${payload.addedBy}`;
  if (payload.isTask || payload.isProjectTask || payload.isProjectSubtask) {
    if (payload.resource_content.status) description += ` (${payload.resource_content.status})`;
  }

  console.info(`[FormatWsAdded]: ${JSON.stringify({title: `Added to ${resourceLabel}: ${payload.resource_content.title || payload.resource_content.id}`,
    description,
    link: payload.link,})}`)

  return {
    title: `[${priority}] Added to ${resourceLabel}: ${payload.resource_content.title || payload.resource_content.id}`,
    description,
    link: payload.link,
  };
}

function formatWsUpdate(batchedResources) {
  const wsNotifications = [];

  // Process Projects
  (batchedResources.project || []).forEach((proj) => {
    const updated = proj.resource_content.updated;
    wsNotifications.push({
      title: `Updated Project: ${updated.title}`,
      link: `/app/project/${proj.resource_id}`,
      description: `Project updated by ${proj.updated_by || 'Unknown'}. Description: "${updated.description || ''}".`
    });
  });

  // Process Tasks
  (batchedResources.task || []).forEach((task) => {
    const updated = task.resource_content.updated;

    let titlePrefix;
    if (updated.parent) {
      // Has a parent → subtask
      titlePrefix = `Updated Project Subtask: ${updated.title}`;
    } else if (updated.project_id) {
      // Belongs to a project → project task
      titlePrefix = `Updated Project Task: ${updated.title}`;
    } else {
      // Normal task
      titlePrefix = `Updated Task: ${updated.title}`;
    }

    const link = updated.project_id
      ? `/app/project/${updated.project_id}`
      : `/app/task/${task.resource_id}`;

    const description = `Updated by ${task.updated_by || 'Unknown'}. Status: ${updated.status || 'N/A'}, Priority: ${updated.priority || 'N/A'}.`;

    wsNotifications.push({
      title: titlePrefix,
      link,
      description
    });
  });

  console.log(`[FormatWsUpdate]: ${wsNotifications}`)

  return wsNotifications;
}

function formatWsReminder(wsPayload) {
  if (!wsPayload || !wsPayload.task) return null;

  const task = wsPayload.task;

  // Determine link: if task belongs to a project, link to project; else, task page
  const link = task.project_id
    ? `/app/project/${task.project_id}`
    : `/app/task/${wsPayload.resource_id}`;

  // Construct title
  const title = `Upcoming Deadline: ${task.title}`;

  // Construct description
  const description = `Reminder set for ${wsPayload.day} day(s) before deadline. ` +
    `Status: ${task.status || 'N/A'}, Priority: ${task.priority || 'N/A'}. ` +
    `${task.description ? `Description: "${task.description}"` : ''}`;

  console.info(`[FormatWsReminder]: ${JSON.stringify({title, link, description})}`)
  return {
    title,
    link,
    description
  };
}


module.exports = { initWebSocketServer, broadcastToUser, formatWsAdded, formatWsUpdate, formatWsReminder };
