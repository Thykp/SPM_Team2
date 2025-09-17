const express = require('express');
const router = express.Router();
const user = require("../model/user");

router.get("/", async (_req, res) => {
  try {
    res.status(200).json('Health Check: Success!');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all", async (_req, res) => {
  try {
    const all = await user.getAllUsers();
    res.status(200).json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/dropdown", async (_req, res) => {
  try {
    const allUsers = await user.getAllUsersDropdown();
    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
