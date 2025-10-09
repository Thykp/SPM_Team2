const express = require('express');

const project = require("./project2") // edited this to use the revamped version

const router = express.Router();

router.use('/project', project)

module.exports = router;
