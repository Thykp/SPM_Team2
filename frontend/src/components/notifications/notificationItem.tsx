


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

// "use client";

// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Trash2 } from "lucide-react";
// import type { Notification } from "@/lib/api";

// type Props = {
//   notif: Notification;
//   onDelete: (id: string) => void;
//   onToggleUserSetRead: (id: string) => void;
// };

// export function NotificationItem({ notif, onDelete, onToggleUserSetRead }: Props) {
//   const { id, from_username, notif_text, read, user_set_read, link_url, created_at } = notif;

//   // ---------------- RED DOT LOGIC ----------------
//   let redDotClass = "bg-transparent";
//   if (!read && !user_set_read) redDotClass = "bg-red-500 animate-pulse";
//   else if (read && !user_set_read) redDotClass = "bg-gray-400";
//   else if (user_set_read) redDotClass = "bg-transparent";

//   // ---------------- FORMATTING ----------------
//   const formattedDate = created_at
//     ? new Date(created_at).toLocaleString("en-US", {
//         weekday: "short",
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "";

//   // ---------------- CONTENT ----------------
//   const content = (
//     <div className="flex-1">
//       <div className="font-medium text-gray-900">
//         {from_username ?? "System"}
//       </div>
//       <div className="text-gray-700">{notif_text}</div>
//       {formattedDate && (
//         <div className="text-xs text-gray-500 mt-1 italic">{formattedDate}</div>
//       )}
//     </div>
//   );

//   return (
//     <div className="px-3 py-3 text-sm border-b flex items-start justify-between hover:bg-gray-50 transition">
//       {/* Left side: red dot + content */}
//       <div className="flex items-start space-x-3 flex-1">
//         {/* Red dot */}
//         <button
//           onClick={() => onToggleUserSetRead(id)}
//           className={`mt-2 h-3 w-3 rounded-full ${redDotClass} cursor-pointer flex-shrink-0`}
//           aria-label="Toggle read/unread"
//         />

//         {/* Content (clickable if link_url exists) */}
//         {link_url ? (
//           <Link href={link_url} className="flex-1 no-underline hover:underline">
//             {content}
//           </Link>
//         ) : (
//           content
//         )}
//       </div>

//       {/* Delete button */}
//       <Button
//         onClick={() => onDelete(id)}
//         variant="ghost"
//         size="icon"
//         className="text-red-500 hover:text-white hover:bg-red-500 transition ml-2"
//         aria-label="Delete notification"
//       >
//         <Trash2 className="h-4 w-4" />
//       </Button>
//     </div>
//   );
// }
