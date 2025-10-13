const { subscribe, CHANNEL } = require("./redis");
const { broadcastToUser } = require("./websocket");
const { supabase } = require("../db/supabase");

async function handleIncomingNotification(notif) {
  try {
    // enrich with sender name
    let from_username = "Unknown";
    if (notif.from_user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", notif.from_user)
        .single();

      if (profile) from_username = profile.display_name;
    }

    const enriched = { ...notif, from_username };
    broadcastToUser(notif.to_user, enriched);
  } catch (err) {
    console.error("[handler] Error handling notification:", err);
  }
}

function subscribeToNotifications() {
  subscribe(CHANNEL, handleIncomingNotification);
}

module.exports = { subscribeToNotifications };
