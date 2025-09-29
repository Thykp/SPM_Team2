"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "../../hooks/useNotifications";

export function NotificationsPanel({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [localNotifs, setLocalNotifs] = useState<any[]>([]);
  const notifications = useNotifications(userId);

  useEffect(() => {
    setLocalNotifs(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!open) return;

    const unreadIds = localNotifs.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const timer = setTimeout(() => {
      setLocalNotifs(prev =>
        prev.map(n =>
          unreadIds.includes(n.id) ? { ...n, read: true } : n
        )
      );

      fetch(`${import.meta.env.VITE_API_URL}/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      }).catch(err =>
        console.error("❌ Failed to mark notifications as read:", err)
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [open, localNotifs]);

  const hasGlobalBadge = localNotifs.some(n => !n.read);
  return (
    <div className="relative">  
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="h-5 w-5" />
        {hasGlobalBadge && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2 font-semibold border-b">Notifications</div>
          <div className="max-h-64 overflow-y-auto">
            {localNotifs.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              localNotifs.map(n => (
                <div
                  key={n.id}
                  className={`px-3 py-2 text-sm border-b hover:bg-gray-100 flex justify-between items-start`}
                >
                  <div>
                    <div className="font-medium">{n.from_username ?? "Unknown"}</div>
                    <div className="text-gray-600">{n.notif_text}</div>
                    {n.created_at && (
                      <div className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Red dot only if unread */}
                  {!n.read && (
                    <span className="ml-2 mt-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
