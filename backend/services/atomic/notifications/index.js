require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const notifRoutes = require("./api/notificationRoutes");
const { initWebSocketServer } = require("./services/websocket");
const { subscribeToNotifications } = require("./services/notificationHandler");

const app = express();
app.use(express.json());

// ----- CORS -----
const allowed = ["http://localhost:5173", process.env.FE_ENDPOINT].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use("/", notifRoutes);

const PORT = process.env.PORT || 4201;
const server = createServer(app);
initWebSocketServer(server);

subscribeToNotifications();

server.listen(PORT, "0.0.0.0", () =>
  console.log(`Notifications Micoservice running on port ${PORT}`)
);
