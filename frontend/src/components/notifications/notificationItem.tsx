"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Notification } from "@/lib/api";

type Props = {
  notif: Notification;
  onDelete: (id: string) => void;
  onToggleUserSetRead: (id: string) => void;
};

export function NotificationItem({ notif, onDelete, onToggleUserSetRead }: Props) {
  const { id, read, user_set_read } = notif;

  // ---------------- RED DOT LOGIC ----------------
  const redDotClass = !read && !user_set_read
    ? "bg-red-500 animate-pulse"
    : read && !user_set_read
    ? "bg-gray-400"
    :  "bg-red-500";

  return (
    <div className="px-3 py-2 text-sm border-b hover:bg-gray-100 flex items-start">
      {/* Red dot / toggle */}
      <div className="flex items-center">
        <button
            onClick={() => onToggleUserSetRead(id)}
            className={`mr-2 h-3 w-3 rounded-full ${redDotClass} cursor-pointer flex-shrink-0`}
            aria-label="Toggle read/unread"
        />
      </div>


      {/* Notification content */}
      <div className="flex-1">
        <div className="font-medium">{notif.from_username ?? "Unknown"}</div>
        <div className="text-gray-600">{notif.notif_text}</div>
      </div>

      {/* Delete button */}
      <Button
        onClick={() => onDelete(id)}
        className="bg-white text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-2 py-1 rounded flex-shrink-0"
        aria-label="Delete notification"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
