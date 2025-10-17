const express = require('express');

const report = require("./report")

const router = express.Router();

router.use('/report', report)

module.exports = router;

