// NotificationPreferences.tsx
import { useEffect, useState } from "react";
import { Notification } from "../../lib/api";

type Props = {
  userId: string;
};

export function NotificationPreferences({ userId }: Props) {
  const [preferences, setPreferences] = useState<string[]>([]);
  const options = ["in-app", "email"];

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const prefs = await Notification.getPreferences(userId);
        setPreferences(prefs || []);
      } catch (err) {
        console.error("Failed to fetch notification preferences", err);
      }
    }
    fetchPreferences();
  }, [userId]);

  const togglePreference = async (pref: string) => {
    const updated = preferences.includes(pref)
      ? preferences.filter(p => p !== pref)
      : [...preferences, pref];

    try {
      await Notification.updatePreferences(userId, updated);
      setPreferences(updated);
    } catch (err) {
      console.error("Failed to update notification preferences", err);
    }
  };

  return (
    <div className="px-4 py-2 space-y-2">
      <p className="text-sm font-medium">Notification Preferences</p>
      {options.map(pref => (
        <label key={pref} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.includes(pref)}
            onChange={() => togglePreference(pref)}
            className="accent-primary"
          />
        {pref.charAt(0).toUpperCase() + pref.slice(1)}
        </label>
      ))}
    </div>
  );
}
