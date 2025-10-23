import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Recurrence } from "@/lib/api";
import type { RecurrencePostRequestDto, RecurrenceDto } from "@/lib/api";

type RecurTaskProps = {
  taskId: string;
  onClose: () => void;
};

export const RecurTask: React.FC<RecurTaskProps> = ({ taskId, onClose }) => {
  const [frequency, setFrequency] = useState<"Day" | "Week" | "Month">("Day");
  const [interval, setInterval] = useState<number | "">("");
  const [endDate, setEndDate] = useState<string>(""); // Local datetime
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false); // Checkbox state for enabling recurrence
  const [noEndDate, setNoEndDate] = useState(false); // Checkbox state for hiding end date
  const [recurrenceId, setRecurrenceId] = useState<string | null>(null); // Track recurrence ID

  // Fetch recurrence data on component mount
  useEffect(() => {
    const fetchRecurrence = async () => {
      try {
        setLoading(true);
        const recurrences = await Recurrence.getRecurrencesByTaskId(taskId);
        if (recurrences.length > 0) {
          const recurrence = recurrences[0]; // Assuming one recurrence per task
          setRecurrenceId(recurrence.id);
          setIsRecurring(true);
          setFrequency(recurrence.frequency);
          setInterval(recurrence.interval);
          if (recurrence.end_date === null) {
            setNoEndDate(true);
          } else {
            setEndDate(formatToLocalDatetime(recurrence.end_date ?? ""));
          }
        } else {
          // No recurrence exists for this task
          setIsRecurring(false);
          setFrequency("Day");
          setInterval("");
          setEndDate("");
          setNoEndDate(false);
        }
      } catch (error) {
        console.error("Failed to fetch recurrence data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecurrence();
  }, [taskId]);

  // Save recurrence data
  const handleSave = async () => {
    if (isRecurring) {
      if (!interval || interval <= 0) {
        alert("Please enter a valid interval.");
        return;
      }
      if (!noEndDate && !endDate) {
        alert("Please select an end date.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: RecurrencePostRequestDto = {
        frequency: isRecurring ? frequency : "Day",
        interval: isRecurring ? (interval || 1) : 1,
        end_date: isRecurring && !noEndDate ? new Date(endDate).toISOString() : null,
      };

      if (recurrenceId) {
        // Update existing recurrence
        await Recurrence.updateRecurrence(recurrenceId, payload);
      } else {
        // Create new recurrence
        await Recurrence.createRecurrence({ ...payload, taskId });
      }

      console.log("Recurrence Payload: " + payload)
      alert("Recurrence saved successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to save recurrence:", error);
      alert("Failed to save recurrence. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatToLocalDatetime = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000); // Adjust for timezone offset
    return localDate.toISOString().slice(0, 16); // Return in "YYYY-MM-DDTHH:mm" format
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Manage Task Recurrence</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[50vh]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Recurring Checkbox */}
            <Label className="flex items-start gap-3">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!!checked)}
              />
              <div>
                <p className="text-sm font-medium">Enable Task Recurrence</p>
                <p className="text-sm text-muted-foreground">
                  Check this box to enable recurrence for this task.
                </p>
              </div>
            </Label>

            {/* No End Date Checkbox */}
            {isRecurring && (
              <Label className="flex items-start gap-3">
                <Checkbox
                  id="noEndDate"
                  checked={noEndDate}
                  onCheckedChange={(checked) => setNoEndDate(!!checked)}
                />
                <div>
                  <p className="text-sm font-medium">No End Date</p>
                  <p className="text-sm text-muted-foreground">
                    Check this box if the task recurrence does not have an end date.
                  </p>
                </div>
              </Label>
            )}

            {/* Interval and Frequency */}
            {isRecurring && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="interval">Interval</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    placeholder="Enter interval (e.g., 2)"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value) || "")}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as "Day" | "Week" | "Month")}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Day">Day</option>
                    <option value="Week">Week</option>
                    <option value="Month">Month</option>
                  </select>
                </div>
              </div>
            )}

            {/* End Date */}
            {isRecurring && !noEndDate && (
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};