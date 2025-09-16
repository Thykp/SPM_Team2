const express = require('express');

const project = require("./project")

const router = express.Router();

router.use('/project', project)

module.exports = router;
