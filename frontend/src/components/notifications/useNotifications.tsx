import { useEffect, useState } from "react";
import { Notification as notif } from "@/lib/api";
import type { Notification } from "@/lib/api";

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastToastId, setLastToastId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const data = await notif.getNotifications(userId);
        if (isMounted) setNotifications(data);
      } catch (err) {
        console.error("❌ Failed to fetch notifications:", err);
      }
    };

    fetchAll();

    ws = new WebSocket(`${import.meta.env.VITE_WS_URL || "ws://localhost:4201"}/ws?userId=${userId}`);

    ws.onopen = () => {
      console.log("✅ Connected to notifications WS");
      ws.send(JSON.stringify({ type: "identify", userId }));
    };

    ws.onmessage = (event) => {
      try {
        const notif: Notification = JSON.parse(event.data);

        let title = "Notification";
        if (notif.resource_type === "task") title = "Added to new Task";
        else if (notif.resource_type === "project") title = "Added to new Project";

        if ((window as any).addToast && notif.id !== lastToastId) {
          (window as any).addToast({
            id: notif.id,
            title,
            description: `${notif.from_username ?? "Unknown"}: ${notif.notif_text}`,
          });
          setLastToastId(notif.id);
        }

        setNotifications((prev) => [notif, ...prev]);
      } catch (err) {
        console.error("❌ Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => console.log("❌ Notifications WS closed");
    ws.onerror = (err) => console.error("❌ Notifications WS error:", err);

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [userId, lastToastId]);

  return notifications;
}
