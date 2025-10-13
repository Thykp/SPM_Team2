const { WebSocketServer } = require("ws");

const clients = new Map(); 

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
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId");
      if (!userId) return ws.close();

      addClient(userId, ws);
      console.log(`[ws] Connected: ${userId}`);
    } catch (err) {
      console.error("[ws] Connection error:", err);
      ws.close();
    }
  });

  // heartbeat
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return wss;
}

module.exports = { initWebSocketServer, broadcastToUser };
