const express = require("express");
const router = express.Router();
const { supabase } = require("../db/supabase");

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


module.exports = router;
