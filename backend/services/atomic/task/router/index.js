const express = require('express');

const task = require("./TaskRoutes")

const router = express.Router();

router.use('/task', task)

module.exports = router;

