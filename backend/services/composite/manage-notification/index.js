require('dotenv').config();
const express = require('express');
const cors = require('cors');
const manageNotificationRoutes = require('./api/manage-notification');


const app = express();
app.use(express.json());

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

// API routes
app.use('/', manageNotificationRoutes);

const PORT = process.env.PORT || 4202;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Manage Notifications Service running on port:${PORT}`);
});