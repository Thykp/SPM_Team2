import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox"; // Import shadcn's Checkbox

type RecurTaskProps = {
  taskId: string;
  onClose: () => void;
};

export const RecurTask: React.FC<RecurTaskProps> = ({ taskId, onClose }) => {
  const [frequency, setFrequency] = useState("Day");
  const [interval, setInterval] = useState<number | "">("");
  const [endDate, setEndDate] = useState<string>(""); // Local datetime
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false); // Checkbox state for enabling recurrence
  const [noEndDate, setNoEndDate] = useState(false); // Checkbox state for hiding end date

  // Convert local datetime to UTC for storage
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
      const utcEndDate = isRecurring && !noEndDate ? new Date(endDate).toISOString() : null; // Convert to UTC if recurring and end date is provided

      console.log({
        taskId,
        frequency: isRecurring ? frequency : null,
        interval: isRecurring ? interval : null,
        endDate: utcEndDate, // Send UTC to backend if recurring and end date is provided
        isRecurring, // Checkbox state
        noEndDate, // Checkbox state for no end date
      });

      alert("Recurrence saved successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to save recurrence:", error);
      alert("Failed to save recurrence. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">Manage Task Recurrence</CardTitle>
            </div>
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
            {/* Recurring Checkbox with Descriptor */}
            <Label
              className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
            >
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!!checked)} // Handle state change
                className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
              />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">
                  Enable Task Recurrence
                </p>
                <p className="text-muted-foreground text-sm">
                  Check this box to enable recurrence for this task.
                </p>
              </div>
            </Label>

            {/* No End Date Checkbox */}
            {isRecurring && (
              <Label
                className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
              >
                <Checkbox
                  id="noEndDate"
                  checked={noEndDate}
                  onCheckedChange={(checked) => setNoEndDate(!!checked)} // Handle state change
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                />
                <div className="grid gap-1.5 font-normal">
                  <p className="text-sm leading-none font-medium">
                    No End Date
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Check this box if the task recurrence does not have an end
                    date.
                  </p>
                </div>
              </Label>
            )}

            {/* Interval and Frequency */}
            {isRecurring && (
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="interval" className="text-base font-medium">
                    Interval
                  </Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    placeholder="Enter interval (e.g., 2)"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value) || "")}
                    required={isRecurring}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="frequency" className="text-base font-medium">
                    Frequency
                  </Label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-base font-medium">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={isRecurring && !noEndDate}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11"
                disabled={loading || (isRecurring && !noEndDate && !endDate)}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};