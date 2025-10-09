const express = require('express');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const { FE_ENDPOINT } = process.env;

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  cors({
    origin: ['http://localhost:5173', FE_ENDPOINT].filter(Boolean),
    credentials: true
  })
);

app.get('/', (req, res) => {
  res.status(200).send('ok');
});

const apiRouter = require('./router/index');
app.use('/', apiRouter);

module.exports = app;
