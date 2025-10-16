"use client";

import { useState, useEffect } from "react";
import { Notification } from "../../lib/api";

type Frequency = "Immediate" | "Daily" | "Weekly";

type Props = {
  userId: string | undefined;
};

export function NotificationFrequency({ userId }: Props) {
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

  const [frequency, setFrequency] = useState<Frequency>("Immediate");
  const [dailyTime, setDailyTime] = useState("09:00");
  const [weeklyDay, setWeeklyDay] = useState("Monday");
  const [weeklyTime, setWeeklyTime] = useState("09:00");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchPreferences = async () => {
      try {
        const res = await Notification.getFrequencyPreferences(userId);
        if (cancelled) return;

        const data = res;

        if (data.delivery_frequency)
          setFrequency(
            data.delivery_frequency.charAt(0).toUpperCase() +
              data.delivery_frequency.slice(1).toLowerCase() as Frequency
          );

        if (
          data.delivery_time &&
          data.delivery_time !== "1970-01-01T00:00:00+00:00"
        ) {
          const time = new Date(data.delivery_time)
            .toISOString()
            .substring(11, 16);
          if (data.delivery_frequency.toLowerCase() === "daily")
            setDailyTime(time);
          if (data.delivery_frequency.toLowerCase() === "weekly")
            setWeeklyTime(time);
        }

        if (data.delivery_day) setWeeklyDay(data.delivery_day);
      } catch (err) {
        console.error("Failed to fetch notification frequency preferences:", err);
      }
    };

    fetchPreferences();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    const time =
      frequency === "Daily"
        ? dailyTime
        : frequency === "Weekly"
        ? weeklyTime
        : "00:00";

    // convert "HH:MM" to full timestamp for backend
    const timeStamp = `1970-01-01T${time}:00+00:00`;

    const payload = {
      delivery_frequency: frequency,
      delivery_time: timeStamp,
      delivery_day: frequency === "Weekly" ? weeklyDay : null,
    };

    try {
      await Notification.updateFrequencyPreferences(userId, payload);
      showToast("Success", "Frequency Settings Saved", "#c1ffe8ff", "#044b00ff");
    } catch (err) {
      console.error("Failed to save preferences:", err);
      showToast("Error", "Unable to update frequency preferences", "#f3c7c7ff", "#3b0000ff");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Notification Delivery Frequency</h2>

      <div>
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
          <input
            type="time"
            value={dailyTime}
            onChange={(e) => setDailyTime(e.target.value)}
            className="ml-4 border rounded p-1"
          />
        )}

        {frequency === "Weekly" && (
          <div className="ml-4 space-y-1">
            <select
              value={weeklyDay}
              onChange={(e) => setWeeklyDay(e.target.value)}
              className="border rounded p-1"
            >
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={weeklyTime}
              onChange={(e) => setWeeklyTime(e.target.value)}
              className="border rounded p-1"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Preferences
      </button>
    </div>
  );
}
