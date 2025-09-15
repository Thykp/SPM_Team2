// backend/services/atomic/profile/index.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

// ----- middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS:
const { FE_ENDPOINT } = process.env;
const allowed = ['http://localhost:5173', FE_ENDPOINT].filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

// ----- routes
app.get('/', (_req, res) => res.status(200).json({ ok: true, service: 'profile' }));

app.use('/user', require('./api/user'));

module.exports = app;

if (require.main === module) {
  const PORT = Number(process.env.PORT || 3030);
  app.listen(PORT, () => {
    console.log(`[profile] running on http://localhost:${PORT}`);
    console.log(`[profile] health:  http://localhost:${PORT}/`);
    console.log(`[profile] users:   http://localhost:${PORT}/user/all`);
  });
}
