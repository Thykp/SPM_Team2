const express = require("express");
const router = express.Router();
const { supabase } = require("../db/supabase");
const Redis = require("ioredis");

// Redis setup
const redisPub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CHANNEL = "notifications";

router.get("/", async (_req, res) => {
  try {
    res.status(200).json('Health Check: Success!');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch all notifications for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("notifications_with_user")
      .select("*")
      .eq("to_user", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[notifications:get] Supabase fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    res.json(data);
  } catch (err) {
    console.error("[notifications:get] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark notifications as read
router.patch("/read", async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No notification IDs provided" });
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids)
      .select();

    if (error) {
      console.error("[notifications:read] Supabase update error:", error);
      return res.status(500).json({ error: "Failed to mark notifications as read" });
    }

    res.json({ success: true, updated: data });
  } catch (err) {
    console.error("[notifications:read] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete all notifications for a user
router.delete("/all/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user", userId)
      .select();

    if (error) {
      console.error("[notifications:deleteAll] Supabase delete error:", error);
      return res.status(500).json({ error: "Failed to delete all notifications" });
    }

    res.json({ success: true, deleted: data });
  } catch (err) {
    console.error("[notifications:deleteAll] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Delete a specific notification for a user
router.delete("/:userId/:notificationId", async (req, res) => {
  const { userId, notificationId } = req.params;

  if (!userId || !notificationId) {
    return res.status(400).json({ error: "User ID and notification ID are required" });
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("to_user", userId)
      .eq("id", notificationId)
      .select();

    if (error) {
      console.error("[notifications:delete] Supabase delete error:", error);
      return res.status(500).json({ error: "Failed to delete notification" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Notification not found for this user" });
    }

    res.json({ success: true, deleted: data[0] });
  } catch (err) {
    console.error("[notifications:delete] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Accept new notifications 
router.post("/notify", async (req, res) => {
  const notif = req.body;

  // Basic validation
  if (!notif.to_user || !notif.notif_text || !notif.notif_type) {
    return res.status(400).json({ error: "Missing required notification fields" });
  }

  const notificationPayload = {
    notif_text: notif.notif_text,
    notif_type: notif.notif_type,
    from_user: notif.from_user || null,
    to_user: notif.to_user,
    resource_type: notif.resource_type || null,
    resource_id: notif.resource_id || null,
    project_id: notif.project_id || null,
    priority: notif.priority || 0,
    read: false,
    metadata: notif.metadata || {},
  };

  try {
    // Store notification in Supabase
    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationPayload)
      .select()
      .single();

    if (error) {
      console.error("[notifications:notify] Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to store notification" });
    }

    // Publish notification via Redis (for WebSocket broadcast)
    await redisPub.publish(CHANNEL, JSON.stringify(data));
    console.info(`[notifications:notify] Sent notification to ${data.to_user}`);

    res.json({ success: true, notification: data });
  } catch (err) {
    console.error("[notifications:notify] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
