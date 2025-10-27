import React, { useState } from "react";
import { Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { TaskApi, type TaskDeadlineReminder } from "@/lib/api";
import { Notification as NotificationApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type TaskReminderProps = {
  taskId: string;
  status: string;
  deadline: string;
};

export const TaskReminder: React.FC<TaskReminderProps> = ({ taskId, status, deadline }) => {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const username = profile?.display_name || user?.email || "Unknown User";

  const [loading, setLoading] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  if (status === "Overdue" || !userId) return null;

  const daysUntilDeadline = deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : Infinity;

  // ✅ Filter out default reminder options that exceed deadline
  const defaultOptions = [1, 3, 7].filter((day) => day <= daysUntilDeadline);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data: TaskDeadlineReminder = await TaskApi.getDeadlineReminder(taskId, userId);
      setReminderDays(data.deadline_reminder || []);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      setError("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const persistReminders = async (reminders: number[]) => {
    try {
      await TaskApi.setDeadlineReminder(taskId, userId, reminders);
      await NotificationApi.publishDeadlineReminder({
        taskId,
        userId,
        deadline,
        reminderDays: reminders,
        username,
      });
    } catch (err) {
      console.error("Failed to save reminders or publish notification:", err);
      setError("Failed to save reminders");
    }
  };

  const addReminder = (days: number) => {
    const validDays = Number(days);
    if (isNaN(validDays) || validDays <= 0)
      return setError("Enter a valid number > 0");
    if (validDays > daysUntilDeadline)
      return setError(`Can't add beyond ${daysUntilDeadline} days before deadline`);
    if (reminderDays.includes(validDays))
      return setError("Reminder already added");

    const updated = [...reminderDays, validDays].sort((a, b) => a - b);
    setReminderDays(updated);
    setInputValue("");
    setError("");
    persistReminders(updated);
  };

  const removeReminder = (day: number) => {
    const updated = reminderDays.filter((d) => d !== day);
    setReminderDays(updated);
    persistReminders(updated);
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchReminders()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Clock className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-3 bg-white border border-gray-300 rounded shadow-lg z-[1000]"
      >
        <p className="text-xs text-gray-700 mb-2 font-medium">
          Remind me before deadline:
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
          </div>
        ) : (
          <>
            {defaultOptions.length > 0 ? (
              <div className="flex space-x-2 mb-3">
                {defaultOptions.map((day) => (
                  <Button
                    key={day}
                    size="sm"
                    variant="outline"
                    onClick={() => addReminder(day)}
                  >
                    {day} day{day > 1 ? "s" : ""}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-2 italic">
                No default reminders available before deadline.
              </p>
            )}

            <div className="flex space-x-2 mb-2">
              <input
                type="number"
                min={1}
                max={daysUntilDeadline}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Custom (max ${daysUntilDeadline})`}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
              />
              <Button size="sm" onClick={() => addReminder(Number(inputValue))}>
                Add
              </Button>
            </div>

            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

            {reminderDays.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-xs text-gray-600 mb-1">Reminders:</p>
                <ul className="space-y-1 max-h-24 overflow-auto">
                  {reminderDays.map((d) => (
                    <li
                      key={d}
                      className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded"
                    >
                      <span>
                        {d} day{d > 1 ? "s" : ""} before
                      </span>
                      <button
                        onClick={() => removeReminder(d)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
