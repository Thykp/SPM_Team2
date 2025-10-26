"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/api";
import { Notification as NotificationApi } from "@/lib/api"; // renamed
import { NotificationItem } from "./notificationItem";

export function NotificationsPanel({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastToastId, setLastToastId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ------------------ Fetch & WebSocket ------------------
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchAll = async () => {
      try {
        const data = await NotificationApi.getNotifications(userId);
        if (isMounted) setNotifications(data);
      } catch (err) {
        console.error("❌ Failed to fetch notifications:", err);
      }
    };
    fetchAll();

    const wsUrl = `${import.meta.env.VITE_WS_URL || "ws://localhost:4201"}/ws?userId=${userId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to notifications WS");
      ws.send(JSON.stringify({ type: "identify", userId }));
    };

   ws.onmessage = (event) => {
    try {
      const newNotif: Notification & { push?: boolean } = JSON.parse(event.data);

      if (newNotif.push && (window as any).addToast && newNotif.id !== lastToastId) {
        (window as any).addToast({
          id: newNotif.id,
          title: newNotif.title || "Notification",
          description: newNotif.description || "",
          url: newNotif.link || undefined,
        });
        setLastToastId(newNotif.id);
      }

      setNotifications((prev) => [newNotif, ...prev]);
    } catch (err) {
      console.error("Failed to parse WS message:", err);
    }
  };


    ws.onclose = () => console.log("❌ Notifications WS closed");
    ws.onerror = (err) => console.error("❌ Notifications WS error:", err);

    return () => {
      isMounted = false;
      ws.close();
    };
  }, [userId, lastToastId]);

  // ------------------ Delete single / all ------------------
  const handleDelete = async (notifId: string) => {
    try {
      await NotificationApi.deleteNotification(userId, notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err) {
      console.error("❌ Failed to delete notification:", err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await NotificationApi.deleteAllNotification(userId);
      setNotifications([]);
    } catch (err) {
      console.error("❌ Failed to delete all notifications:", err);
    }
  };

  // ------------------ Toggle user_set_read ------------------
  const handleToggleUserSetRead = async (notifId: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, user_set_read: !n.user_set_read } : n
        )
      );
      await NotificationApi.toggleReadNotification(notifId);
    } catch (err) {
      console.error("❌ Failed to toggle read for notification:", err);
    }
  };

  // ------------------ Mark as read on panel open ------------------
  useEffect(() => {
    if (!open) return;

    const toMarkRead = notifications
      .filter((n) => !n.read && !n.user_set_read)
      .map((n) => n.id);

    if (toMarkRead.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        setNotifications((prev) =>
          prev.map((n) =>
            toMarkRead.includes(n.id) ? { ...n, read: true } : n
          )
        );
        await NotificationApi.markAsRead(toMarkRead);
      } catch (err) {
        console.error("❌ Failed to mark notifications as read:", err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [open, notifications]);

  // ------------------ Close panel on outside click ------------------
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasUnread = notifications.some((n) => !n.read || n.user_set_read);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-100 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2 font-semibold border-b flex justify-between items-center">
            Notifications
            {notifications.length > 0 && (
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
            {notifications.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onDelete={handleDelete}
                  onToggleUserSetRead={handleToggleUserSetRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
