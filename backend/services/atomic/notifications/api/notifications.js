const express = require("express");
const router = express.Router();
const { supabase } = require("../db/supabase");

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id,
        notif_text,
        created_at,
        is_read,
        from_user,
        users:from_user (username)
      `)
      .eq("to_user", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api] Supabase fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }

    // Map into a cleaner response
    const notifications = data.map((n) => ({
      id: n.id,
      notif_text: n.notif_text,
      created_at: n.created_at,
      is_read: n.is_read,
      from_user: n.from_user,
      from_username: n.users?.username ?? "Unknown",
    }));

    res.json(notifications);
  } catch (err) {
    console.error("[api] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
