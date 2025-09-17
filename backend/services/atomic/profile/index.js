require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const { FE_ENDPOINT } = process.env;
app.use(
  cors({
    origin: ['http://localhost:5173', FE_ENDPOINT],
    credentials: true
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
