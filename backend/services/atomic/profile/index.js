// require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '../../../..', '.env') });

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/', (req, res) => {
  res.status(200).send('ok');
});

const apiRouter = require('./api/index');
app.use('/', apiRouter);

module.exports = app;

if (require.main === module) {
  const PORT = Number(process.env.PORT || 3030);
  app.listen(PORT, () => {
    console.log(`Profile running on http://localhost:${PORT}`);
  });
}
