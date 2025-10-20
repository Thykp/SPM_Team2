import React, { useEffect, useState } from "react";
import { Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskApi, type TaskDeadlineReminder } from "@/lib/api"; 
import { useAuth } from "@/contexts/AuthContext";

type TaskReminderProps = {
  taskId: string;
  status: string;
};

export const TaskReminder: React.FC<TaskReminderProps> = ({ taskId, status }) => {
  const { user } = useAuth(); 
  const userId = user?.id;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  if (status === "Overdue") return null;

  // Fetch reminders when dropdown opens
  useEffect(() => {
    if (!open || !userId) return;

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

    fetchReminders();
  }, [open]);

  const persistReminders = async (reminders: number[]) => {
    if (!userId) return;
    try {
      await TaskApi.setDeadlineReminder(taskId, userId, reminders);
    } catch (err) {
      console.error("Failed to save reminders:", err);
      setError("Failed to save reminders");
    }
  };

  const addReminder = (days: number) => {
    const validDays = Number(days);
    if (isNaN(validDays) || validDays <= 0) {
      setError("Please enter a valid number greater than 0.");
      return;
    }
    if (reminderDays.includes(validDays)) {
      setError("Reminder already added.");
      return;
    }

    const updated = [...reminderDays, validDays].sort((a, b) => a - b);
    setReminderDays(updated);
    setInputValue("");
    setError("");

    // Persist in background, handle errors
    persistReminders(updated).catch(err => console.error(err));
  };

  const removeReminder = (day: number) => {
    const updated = reminderDays.filter((d) => d !== day);
    setReminderDays(updated);

    // Persist in background, handle errors
    persistReminders(updated).catch(err => console.error(err));
  };


  if (!userId) return null; // don't render if user not logged in

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="h-8 w-8"
      >
        <Clock className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded shadow-lg z-20 p-3">
          <p className="text-xs text-gray-700 mb-2 font-medium">
            Remind me before deadline:
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
            </div>
          ) : (
            <>
              <div className="flex space-x-2 mb-3">
                {[1, 3, 7].map((day) => (
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

              <div className="flex space-x-2 mb-2">
                <input
                  type="number"
                  min={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Custom (e.g. 5)"
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
                        <span>{d} day{d > 1 ? "s" : ""} before</span>
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

          <div className="flex justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
