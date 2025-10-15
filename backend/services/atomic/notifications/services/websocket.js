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

module.exports = { initWebSocketServer, broadcastToUser };
