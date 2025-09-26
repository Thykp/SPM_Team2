require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const { supabase } = require('./db/supabase');
const { WebSocketServer } = require('ws');
const notifRoutes = require('./api/notifications');

const app = express();
app.use(express.json());

// ----- CORS -----
const allowed = ['http://localhost:5173', process.env.FE_ENDPOINT].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

// ----- HTTP routes -----
app.use('/notifications', notifRoutes);

// ----- Redis -----
const redisSub = new Redis(process.env.REDIS_URL || 'redis://redis:6379'); // subscriber
const redisPub = new Redis(process.env.REDIS_URL || 'redis://redis:6379'); // publisher

const CHANNEL = 'notifications';
const SCHEDULE_SET = 'notifications_schedule';
const POLL_INTERVAL = 5000;

// ----- WebSocket Server -----
const PORT = process.env.PORT || 4201;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map(); // userId -> Set<WebSocket>

// ----- WebSocket helpers -----
function addClient(userId, ws) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(ws);

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('close', () => {
    clients.get(userId).delete(ws);
    if (clients.get(userId).size === 0) clients.delete(userId);
    console.log(`[ws] Disconnected: ${userId}`);
  });

  ws.on('error', (err) => {
    console.error(`[ws] Error for ${userId}:`, err.message);
  });
}

wss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      console.log('[ws] No userId in query, closing connection');
      return ws.close();
    }

    addClient(userId, ws);
    console.log(`[ws] Connected: ${userId}`);
  } catch (err) {
    console.error('[ws] Failed to parse connection URL:', err);
    ws.close();
  }
});

// ----- Heartbeat to prevent idle disconnects -----
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// ----- Notification flow -----
async function sendNotification(notif) {
  try {
    // 1. Insert into Supabase
    const { data, error } = await supabase
      .from('notifications')
      .insert(notif)
      .select()
      .single();

    if (error) {
      console.error('[worker] Supabase insert error:', error);
      return;
    }

    // 2. Enrich notification with from_username
    let from_username = "Unknown";
    if (data.from_user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.from_user)
        .single();
      if (profile) from_username = profile.display_name;
    }

    const enriched = { ...data, from_username };

    console.log('[worker] Notification saved & enriched:', enriched);

    // 3. Broadcast via WebSocket
    const sockets = clients.get(notif.to_user);
    if (sockets) {
      for (const ws of sockets) {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(enriched));
      }
      console.log(`[ws] Sent notification to ${notif.to_user}`);
    }
  } catch (err) {
    console.error('[worker] Error sending notification:', err);
  }
}

// ----- Redis subscribers -----
redisSub.subscribe(CHANNEL, (err, count) => {
  if (err) return console.error('[worker] Redis subscribe error', err);
  console.log(`[worker] Subscribed to ${count} channel(s)`);
});

redisSub.on('message', async (_channel, message) => {
  const notif = JSON.parse(message);
  console.log(`[worker] Received message: ${message}`);
  await sendNotification(notif);
});

// ----- Scheduled notifications poller -----
async function pollScheduled() {
  const now = Date.now();
  const items = await redisPub.zrangebyscore(SCHEDULE_SET, 0, now);

  for (const item of items) {
    const notif = JSON.parse(item);
    console.log(`[worker] Sending scheduled notification: ${JSON.stringify(notif)}`);
    await sendNotification(notif);
    await redisPub.zrem(SCHEDULE_SET, item);
  }
}
setInterval(pollScheduled, POLL_INTERVAL);
