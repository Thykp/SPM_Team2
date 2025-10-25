const express = require('express');

const task = require("./TaskRoutes")
const recurrence = require("./RecurrenceRoutes")

const router = express.Router();

router.use('/task', task);
router.use("/recurrence", recurrence);

module.exports = router;

