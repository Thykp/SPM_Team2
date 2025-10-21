"use client";

import { useState, useEffect } from "react";
import { Notification } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";

type Props = { userId?: string };

export function NotificationDelivery({ userId }: Props) {
  const { deliveryPreferences, notificationLoading, refreshPreferences } = useNotification();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const options = ["in-app", "email"];

  useEffect(() => {
    if (deliveryPreferences) setPreferences(deliveryPreferences.delivery_method);
  }, [deliveryPreferences]);

  const showToast = (title: string, desc: string, bg: string, color: string) =>
    (window as any).addToast?.({
      id: crypto.randomUUID(),
      title,
      description: desc,
      bgColor: bg,
      textColor: color,
    });

  const handleTogglePreference = async (pref: string) => {
    if (!userId) return;
    const updated = preferences.includes(pref)
      ? preferences.filter((p) => p !== pref)
      : [...preferences, pref];
    setPreferences(updated);
    setLoading(true);

    try {
      await Notification.updateDeliveryPreferences(userId, updated);
      await refreshPreferences(userId);
      showToast("Success", "Notification preferences updated", "#c1ffe8ff", "#044b00ff");
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      showToast("Error", "Unable to update now. Please try again later.", "#f3c7c7ff", "#3b0000ff");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return <p>Please log in to manage preferences.</p>;
  if (notificationLoading) return <p className="text-gray-500 italic">Loading preferences...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Notification Preferences</h2>
      {options.map((pref) => (
        <label key={pref} className="flex items-center gap-2 text-md">
          <input
            type="checkbox"
            checked={preferences.includes(pref)}
            onChange={() => handleTogglePreference(pref)}
            disabled={loading}
            className="accent-blue-600"
          />
          {pref[0].toUpperCase() + pref.slice(1)}
        </label>
      ))}

      {deliveryPreferences?.email && (
        <p className="text-gray-500 italic text-sm mt-1">
          Emails will be sent to: {deliveryPreferences.email}
        </p>
      )}
    </div>
  );
}
