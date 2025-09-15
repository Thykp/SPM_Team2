const express = require('express');
const router = express.Router();
const user = require("../model/user");

// Health
router.get("/", async (_req, res) => {
  try {
    res.status(200).json('Health Check: Success!');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a list of users for dropdowns
// GET /user/all (dropdowns)
router.get("/all", async (_req, res) => {
  try {
    const all = await user.getAllUsersLite();
    res.status(200).json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /user/all-full (full dump)
router.get("/all-full", async (_req, res) => {
  try {
    const allUsers = await user.getAllUsers();
    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
