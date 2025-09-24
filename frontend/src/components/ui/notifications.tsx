import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "../../hooks/useNotifications";
import { useNotifications } from "../../hooks/useNotifications";

export function NotificationsPanel({ userId }: { userId: string }) {
  const [apiNotifications, setApiNotifications] = useState<Notification[]>([]);
  const wsNotifications = useNotifications(userId);
  const [open, setOpen] = useState(false);

  // Fetch all notifications from API once
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${userId}`);
        const data = await res.json();
        setApiNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
    fetchAll();
  }, [userId]);

  const allNotifications = [...wsNotifications, ...apiNotifications];
  console.log(allNotifications)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {allNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2 font-semibold border-b">Notifications</div>
          <div className="max-h-64 overflow-y-auto">
            {allNotifications.map((n) => (
              <div key={n.id} className="px-3 py-2 text-sm hover:bg-gray-50 border-b">
                <div className="font-medium">{n.from_email ?? "Unknown"}</div>
                <div className="text-gray-600">{n.notif_text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
