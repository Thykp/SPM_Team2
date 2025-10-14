import { useEffect, useState, useCallback } from "react";
import { Notification } from "../../lib/api";

type Props = { userId: string };

export function NotificationPreferences({ userId }: Props) {
  const [preferences, setPreferences] = useState<string[]>([]);
  const options = ["in-app", "email"];

  const showToast = useCallback(
    (title: string, description?: string, bgColor?: string, textColor?: string) => {
      const toastFn = (window as any).addToast;
      if (toastFn) {
        toastFn({
          id: crypto.randomUUID(),
          title,
          description,
          bgColor,
          textColor,
        });
      } else {
        console.warn("Toast system not initialized");
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    Notification.getPreferences(userId)
      .then((prefs) => {
        if (!cancelled) setPreferences(prefs || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to fetch preferences", err);
          showToast("Error", "Failed to fetch preferences", "#f87171", "#fff");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, showToast]);

  const retryAsync = useCallback(
    async (fn: () => Promise<void>, retries = 2, delay = 1000) => {
      try {
        await fn();
      } catch (err) {
        if (retries <= 0) throw err;
        await new Promise((res) => setTimeout(res, delay));
        showToast("Retrying...", `Retrying (${retries} left)`, "#f59e0b", "#fff");
        return retryAsync(fn, retries - 1, delay * 2);
      }
    },
    [showToast]
  );

  const togglePreference = async (pref: string) => {
    const updated = preferences.includes(pref)
      ? preferences.filter((p) => p !== pref)
      : [...preferences, pref];

    try {
      await retryAsync(() => Notification.updatePreferences(userId, updated));
      setPreferences(updated);
      showToast("Success", "Preferences saved", "#34d399", "#fff");
    } catch (err) {
      console.error("Failed to update preferences", err);
      showToast("Error", "Unsuccessful save", "#f87171", "#fff");
    }
  };

  return (
    <div className="px-4 py-2 space-y-2">
      <p className="text-sm font-medium">Notification Preferences</p>
      {options.map((pref) => (
        <label key={pref} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.includes(pref)}
            onChange={() => togglePreference(pref)}
            className="accent-primary"
          />
          {pref[0].toUpperCase() + pref.slice(1)}
        </label>
      ))}
    </div>
  );
}
