import { useEffect, useState } from "react";

export type Notification = {
  id: string;
  notif_text: string;
  notif_type: string;
  from_user: string;
  from_username?: string;
  to_user: string;
  created_at?: string;
  resource_type?: string;
  resource_id?: string;
  project_id?: string;
  priority?: string;
  read: boolean;
  delivery_channels?: string[];
};

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastToastId, setLastToastId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${userId}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: Notification[] = await res.json();
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

        // Determine toast title based on resource_type
        let title = "Notification";
        if (notif.resource_type === "task") title = "Added to new Task";
        else if (notif.resource_type === "project") title = "Added to new Project";

        // Show toast only for new notifications
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
