// purely the notification routes. logic for the routes are in services/notificationService.js

const express = require("express");
const router = express.Router();
const notificationService = require("../services/notificationService");

router.get("/", (_req, res) => res.json("Health Check: Success!"));

// Fetch notifications
router.get("/:userId", async (req, res) => {
  try {
    const data = await notificationService.getUserNotifications(req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.patch("/read", async (req, res) => {
  try {
    const updated = await notificationService.markAsRead(req.body.ids);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all
router.delete("/all/:userId", async (req, res) => {
  try {
    const deleted = await notificationService.deleteAll(req.params.userId);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete one
router.delete("/:userId/:notificationId", async (req, res) => {
  try {
    const deleted = await notificationService.deleteOne(req.params.userId, req.params.notificationId);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New notification
router.post("/notify", async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// toggle if user set notifications as read/unread
router.patch("/toggle/:notifId", async(req,res) => {
  try{
    const { notifId } = req.params
    const toggled = await notificationService.toggleRead(notifId)
    res.json({ success: true, toggled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

module.exports = router;
