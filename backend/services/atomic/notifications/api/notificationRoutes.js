// purely the notification routes. logic for the routes are in services/notificationService.js

const express = require("express");
const router = express.Router();
const notificationService = require("../services/notificationService");
const notificationPreferencesService = require("../services/notificationPreferencesService")

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'notifications',
    timestamp: new Date().toISOString(),
  });

});

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


// GET notifications/preferences/delivery-method/:userId
router.get("/preferences/delivery-method/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const data = await notificationPreferencesService.getNotificationDeliveryPreferences(userId);
    if (!data) return res.status(404).json({ error: "User not found" });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT notifications/preferences/delivery-method/:userId
// Body: { notification_preferences: ["in-app", "email"] }
router.put("/preferences/delivery-method/:userId", async (req, res) => {
  const { userId } = req.params;
  const { delivery_method } = req.body;

  if (!userId) return res.status(400).json({ error: "Missing user ID" });
  if (!Array.isArray(delivery_method))
    return res.status(400).json({ error: "delivery_method must be an array" });
  try {
    const updated = await notificationPreferencesService.updateNotificationDeliveryPreferences(userId, delivery_method);
    res.status(200).json({
      message: "Delivery methods updated successfully",
      delivery_method: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/preferences/frequency/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const prefs = await notificationPreferencesService.getNotificationFrequencyPreferences(userId);
    if (!prefs) return res.status(404).json({ error: "User not found" });

    res.status(200).json({data: prefs});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/preferences/frequency/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const prefs = await notificationPreferencesService.updateNotificationFrequencyPreferences(userId, req.body);
    if (!prefs) return res.status(404).json({ error: "User not found" });

    res.status(200).json({data: prefs});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
