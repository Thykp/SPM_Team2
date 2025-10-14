const express = require("express");
const router = express.Router();
const user = require("../model/user");

// Health
router.get("/", async (_req, res) => {
  try {
    res.status(200).json("Health Check: Success!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All users
router.get("/all", async (_req, res) => {
  try {
    const rows = await user.getAllUsers();
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dropdown
router.get("/dropdown", async (_req, res) => {
  try {
    const rows = await user.getAllUsersDropdown();
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff filter (revamped):
// GET /user/staff?team_id=<uuid>&role=Staff
// GET /user/staff?department_id=<uuid>&role=Staff
// If both are present, team_id wins.
router.get("/staff", async (req, res) => {
  try {
    const { team_id, department_id, role } = req.query;
    const rows = await user.getStaffByScope({
      team_id: team_id || null,
      department_id: department_id || null,
      role: role || "Staff",
    });
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// By ID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const profile = await user.getUserDetailsWithId(userId);
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /user/:userId/notifications/preferences
router.get("/:userId/notifications/preferences", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const prefs = await user.getNotificationPreferences(userId);
    if (!prefs) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ notification_delivery: prefs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /user/:userId/notifications/preferences
// Body: { notification_preferences: ["in-app", "email"] }
router.put("/:userId/notifications/preferences", async (req, res) => {
  const { userId } = req.params;
  const { notification_preferences } = req.body;

  if (!userId) return res.status(400).json({ error: "Missing user ID" });
  if (!Array.isArray(notification_preferences))
    return res.status(400).json({ error: "notification_preferences must be an array" });

  try {
    const updated = await user.updateNotificationPreferences(userId, notification_preferences);
    res.status(200).json({
      message: "Notification preferences updated successfully",
      notification_delivery: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
