const express = require("express");
const router = express.Router();
const { supabase } = require("../db/supabase");
const Redis = require("ioredis");

const redisPub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CHANNEL = "notifications";

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("notifications_with_user")
      .select("*")
      .eq("to_user", userId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("[api] Supabase fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    res.json(data);
  } catch (err) {
    console.error("[api] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/read", async (req, res) => {
  const { ids } = req.body;

  if (!ids || !ids.length) return res.status(400).json({ error: "No IDs provided" });

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids)
      .select();

    if (error) {
      console.error("[api] Supabase update error:", error);
      return res.status(500).json({ error: "Failed to mark as read" });
    }

    res.json(data);
  } catch (err) {
    console.error("[api] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/project-collaborators", async (req, res) => {
  // inform collaborators of addition
  const { type, projectId, collaborators, owner, title, description } = req.body;

  if (!projectId || !collaborators || !owner) 
  {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try { 
    const notifications = collaborators
    .filter((c) => c != owner)
    .map((to_user) =>({
          notif_text: title,
          notif_type: "info",
          from_user: owner,
          to_user: to_user,
          resource_type: "project",
          resource_id: projectId,
          project_id: projectId,
          priority: 0,
          read: false
    }))
  
    for (const notif of notifications) {
      await redisPub.publish(CHANNEL, JSON.stringify(notif));
      console.info("sending notification for: " + notif.to_user)
    }

    res.json({ ok: true});
  }
  catch (error) {
    console.error("[api] Error notifying collaborators:", error);
    res.status(500).json({ error: "Failed to notify collaborators" });
  }
})


module.exports = router;
