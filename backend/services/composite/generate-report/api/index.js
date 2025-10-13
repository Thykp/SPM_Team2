const express = require('express');

const task = require("./reports")

const router = express.Router();

router.use('/report', task)

module.exports = router;

