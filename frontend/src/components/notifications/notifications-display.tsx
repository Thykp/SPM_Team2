"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "./useNotifications";
import type { Notification } from "@/lib/api";
import { Notification as notif } from "@/lib/api";

export function NotificationsPanel({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [localNotifs, setLocalNotifs] = useState<Notification[]>([]);
  const notifications = useNotifications(userId);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync local state
  useEffect(() => {
    setLocalNotifs(notifications);
  }, [notifications]);

  // Mark unread notifications as read
  useEffect(() => {
    if (!open) return;

    const unreadIds = localNotifs.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const timer = setTimeout(async () => {
      setLocalNotifs(prev =>
        prev.map(n =>
          unreadIds.includes(n.id) ? { ...n, read: true } : n
        )
      );

      try {
        await notif.markAsRead(unreadIds);
      } catch (err) {
        console.error("❌ Failed to mark notifications as read:", err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [open, localNotifs]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (notifId: string) => {
    try {
      await notif.deleteNotification(userId, notifId);
      setLocalNotifs(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error("❌ Failed to delete notification:", err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notif.deleteAllNotification(userId);
      setLocalNotifs([]);
    } catch (err) {
      console.error("❌ Failed to delete all notifications:", err);
    }
  };

  const hasGlobalBadge = localNotifs.some(n => !n.read);

  return (
    <div className="relative" ref={panelRef}>
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

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2 font-semibold border-b flex justify-between items-center">
            Notifications
            {localNotifs.length > 0 && (
              <Button
                onClick={handleDeleteAll}
                className="bg-white text-red-500 border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 px-2 py-1 rounded"
                aria-label="Delete all notifications"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {localNotifs.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              localNotifs.map(n => (
                <div
                  key={n.id}
                  className="px-3 py-2 text-sm border-b hover:bg-gray-100 flex justify-between items-start"
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

                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="ml-2 mt-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
                    )}
                    <Button
                      onClick={() => handleDelete(n.id)}
                      className="bg-white text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-2 py-1 rounded"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
