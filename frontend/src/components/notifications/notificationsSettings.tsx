import { useEffect, useState } from "react";
import { Notification } from "../../lib/api";

type Props = { userId: string };

export function NotificationPreferences({ userId }: Props) {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const options = ["in-app", "email"];

  const showToast = (title: string, description: string, bgColor: string, textColor: string) => {
    const toastFn = (window as any).addToast;
    toastFn?.({
      id: crypto.randomUUID(),
      title,
      description,
      bgColor,
      textColor,
    });
  };

  // Fetch preferences on mount / when userId changes
  useEffect(() => {
    let cancelled = false;

    const fetchPrefs = async () => {
      try {
        const prefs = await Notification.getPreferences(userId);
        if (!cancelled && prefs) setPreferences(prefs);
      } catch (err) {
        console.error("Failed to fetch preferences", err);
        showToast(
          "Error",
          "Failed to fetch notification preferences",
          "#f3c7c7ff",
          "#3b0000ff"
        );
      }
    };

    fetchPrefs();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Toggle preference with one retry and fallback message
  const handleTogglePreference = async (pref: string) => {
    const updated = preferences.includes(pref)
      ? preferences.filter((p) => p !== pref)
      : [...preferences, pref];

    setPreferences(updated); // Optimistic UI
    setLoading(true);

    let attempt = 1;

    const tryUpdate = async () => {
      try {
        if (attempt > 1) {
          showToast("Error", `Unable to update preferences now. Retrying...`, "#f3c7c7ff", "#3b0000ff");
          // wait 1 second before retry
          await new Promise((res) => setTimeout(res, 3000));
        }
        await Notification.updatePreferences(userId, updated);
        showToast("Success", "Notification preferences updated", "#c1ffe8ff", "#044b00ff");
      } catch (error) {
        if (attempt === 1) {
          attempt++;
          return tryUpdate(); // retry once
        } else {
          console.error("Failed to update notification preferences after retry:", error);
          // Revert optimistic update
          setPreferences((prev) =>
            prev.includes(pref)
              ? prev.filter((p) => p !== pref)
              : [...prev, pref]
          );
          showToast(
            "Error",
            "Unable to update now. Please try again later.",
            "#f3c7c7ff",
            "#3b0000ff"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    tryUpdate();
  };

  return (
    <div className="px-4 py-2 space-y-2">
      <p className="text-sm font-medium">Notification Preferences</p>
      {options.map((pref) => (
        <label key={pref} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preferences.includes(pref)}
            onChange={() => handleTogglePreference(pref)}
            className="accent-primary"
            disabled={loading}
          />
          {pref[0].toUpperCase() + pref.slice(1)}
        </label>
      ))}
    </div>
  );
}
