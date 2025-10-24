"use client";

import { useEffect, useState } from "react";
import { Notification } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";

type Props = { userId?: string };
type Frequency = "Immediate" | "Daily" | "Weekly";

export function NotificationFrequency({ userId }: Props) {
  const { frequencyPreferences, notificationLoading, refreshPreferences } = useNotification();

  const [frequency, setFrequency] = useState<Frequency>("Immediate");
  const [dailyTime, setDailyTime] = useState("09:00");
  const [weeklyDay, setWeeklyDay] = useState("Monday");
  const [weeklyTime, setWeeklyTime] = useState("09:00");

  useEffect(() => {
    if (!frequencyPreferences) return;
    const freq = frequencyPreferences.delivery_frequency;
    if (freq)
      setFrequency(freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase() as Frequency);
    const timeVal = frequencyPreferences.delivery_time;
    if (timeVal && timeVal !== "1970-01-01T00:00:00+00:00") {
      const time = new Date(timeVal).toISOString().substring(11, 16);
      if (freq.toLowerCase() === "daily") setDailyTime(time);
      if (freq.toLowerCase() === "weekly") setWeeklyTime(time);
    }
    if (frequencyPreferences.delivery_day) setWeeklyDay(frequencyPreferences.delivery_day);
  }, [frequencyPreferences]);

  const showToast = (title: string, desc: string, bg: string, color: string) =>
    (window as any).addToast?.({
      id: crypto.randomUUID(),
      title,
      description: desc,
      bgColor: bg,
      textColor: color,
    });

  const handleSave = async () => {
    if (!userId) return;
    const time = frequency === "Daily" ? dailyTime : frequency === "Weekly" ? weeklyTime : "00:00";
    const timeStamp = `1970-01-01T${time}:00+00:00`;

    const payload = {
      delivery_frequency: frequency,
      delivery_time: timeStamp,
      delivery_day: frequency === "Weekly" ? weeklyDay : null,
    };

    try {
      await Notification.updateFrequencyPreferences(userId, payload);
      await refreshPreferences();
      showToast("Success", "Frequency Settings Saved", "#c1ffe8ff", "#044b00ff");
    } catch (err) {
      console.error("Failed to save frequency preferences:", err);
      showToast("Error", "Unable to update frequency preferences", "#f3c7c7ff", "#3b0000ff");
    }
  };

  if (notificationLoading) return <p className="text-gray-500 italic">Loading preferences...</p>;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">Notification Delivery Frequency</h2>

      {["Immediate", "Daily", "Weekly"].map((freq) => (
        <label key={freq} className="block">
          <input
            type="radio"
            name="frequency"
            value={freq}
            checked={frequency === freq}
            onChange={() => setFrequency(freq as Frequency)}
            className="mr-2 accent-blue-600"
          />
          {freq}
        </label>
      ))}

      {frequency === "Daily" && (
        <div className="ml-4">
          <input
            type="time"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="border rounded p-1"
          />
        </div>
      )}

      {frequency === "Weekly" && (
        <div className="ml-4 flex space-x-2">
          <select
            value={weeklyDay}
            onChange={(e) => setWeeklyDay(e.target.value)}
            className="border rounded p-1 block"
          >
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
              (day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              )
            )}
          </select>
          <input
            type="time"
            value={weeklyTime}
            onChange={(e) => setWeeklyTime(e.target.value)}
            className="border rounded p-1 block"
          />
        </div>
      )}

      {/* separate Save button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Save Preferences
        </button>
      </div>

      <p className="text-sm italic text-gray-400">
        This will only affect task updates.
      </p>
    </div>
  );

}
