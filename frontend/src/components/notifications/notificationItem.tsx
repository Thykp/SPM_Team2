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
  const { id, read, user_set_read, title, description, link, created_at } = notif;

  // ---------------- RED DOT LOGIC ----------------
  const redDotClass = !read && !user_set_read
    ? "bg-red-500 animate-pulse"
    : read && !user_set_read
    ? "bg-gray-400"
    : "bg-red-500";

  // ---------------- FORMATTING DATE ----------------
  const formattedDate = created_at
    ? new Date(created_at).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // ---------------- CONTENT ----------------
  const content = (
    <div className="flex-1">
      {title && <div className="font-medium text-gray-900">{title}</div>}
      <div className="text-gray-700">{description}</div>
      {formattedDate && (
        <div className="text-xs text-gray-500 mt-1 italic">{formattedDate}</div>
      )}
    </div>
  );

  const handleClick = (e: React.MouseEvent) => {
    // Prevent the click on the delete or toggle buttons from opening the link
    e.stopPropagation();
  };

  return (
    <div
      className="px-3 py-2 text-sm border-b flex items-start cursor-pointer hover:bg-gray-200 transition-colors duration-200 rounded-sm"
      onClick={() => link && (window.location.href = link)}

    >
      {/* Red dot / toggle */}
      <button
        onClick={(e) => {
          handleClick(e);
          onToggleUserSetRead(id);
        }}
        className={`mr-2 h-3 w-3 rounded-full ${redDotClass} flex-shrink-0`}
        aria-label="Toggle read/unread"
      />

      {/* Notification content */}
      <div className="flex-1 no-underline">{content}</div>

      {/* Delete button */}
      <Button
        onClick={(e) => {
          handleClick(e);
          onDelete(id);
        }}
        className="bg-white text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-2 py-1 rounded flex-shrink-0"
        aria-label="Delete notification"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
