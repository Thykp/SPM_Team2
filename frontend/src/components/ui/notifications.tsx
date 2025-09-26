"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "../../hooks/useNotifications";
import { useNotifications } from "../../hooks/useNotifications";

export function NotificationsPanel({ userId }: { userId: string }) {
  const notifications = useNotifications(userId);
  const [open, setOpen] = useState(false);

  // Track which notifications should temporarily show the badge
  const [badgeMap, setBadgeMap] = useState<Record<string, boolean>>({});

  // Stage 1: Show global badge if any notifications unread initially
  const hasUnreadInitial = notifications.some(n => !n.read);

  // Stage 2: When panel opens, mark visible notifications as read & show temporary badges
  useEffect(() => {
    if (!open) return;

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Mark as read on backend
    fetch(`${import.meta.env.VITE_API_URL}/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    }).catch(err => console.error("Failed to mark notifications as read:", err));

    // Show temporary badge per notification
    const newBadgeMap: Record<string, boolean> = {};
    unreadIds.forEach(id => (newBadgeMap[id] = true));
    setBadgeMap(newBadgeMap);

    // Remove local badges after 2 seconds
    const timer = setTimeout(() => setBadgeMap({}), 2000);
    return () => clearTimeout(timer);
  }, [open, notifications]);

  // Global badge logic:
  // 1. Before panel opens: any unread notifications
  // 2. After panel opens: any local badge still visible
  const hasGlobalBadge = open ? Object.values(badgeMap).some(Boolean) : hasUnreadInitial;

  return (
    <div className="relative">
      {/* Bell Button */}
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
            {notifications.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No notifications</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-3 py-2 text-sm border-b hover:bg-gray-100 flex justify-between items-start ${
                    !n.read ? "bg-gray-50" : ""
                  }`}
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

                  {/* Temporary badge for unread notifications */}
                  {!n.read && badgeMap[n.id] && (
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
