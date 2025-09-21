import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task as TaskType, Task } from "@/lib/api"; // Import Task type and service
import { X } from "lucide-react";

interface LocalTask {
  id: string;
  title: string;
  deadline: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  collaborators: string[];
  owner: string;
  parent?: string | null;
}

interface EditTaskProps {
  taskId: string; // The ID of the task to be edited
  onTaskUpdated: (updatedTask: LocalTask) => void; // Callback to update the task in the parent component
  onClose: () => void; // Callback to close the modal
}

const EditTask: React.FC<EditTaskProps> = ({ taskId, onTaskUpdated, onClose }) => {
  const [task, setTask] = useState<LocalTask | null>(null); // State to store the fetched task
  const [loading, setLoading] = useState(false);

  // Fetch the task details when the component is mounted
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await Task.getTasksById(taskId); // Use the new function
        console.log("Fetched task data:", data);
        setTask(data); // Set the fetched task
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedTaskData = {
        ...task,
      };

      // Simulate an API call to update the task
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      onTaskUpdated(updatedTaskData as LocalTask); // Notify the parent component
      onClose(); // Close the modal
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Loading Task...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Edit Task</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[50vh]">
        <form onSubmit={handleUpdateTask} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
                Task Title
            </Label>
            <Input
                id="title"
                type="text"
                placeholder="Enter a descriptive task title"
                value={task.title}
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, title: e.target.value }))
                }
                className="h-11"
                required
            />
            </div>

            {/* Description */}
            <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
                Task Description
            </Label>
            <textarea
                id="description"
                placeholder="Enter a detailed description of the task"
                value={task.description}
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                required
            />
            </div>

            {/* Status */}
            <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">
                Task Status
            </Label>
            <select
                id="status"
                value={task.status}
                onChange={(e) =>
                setTask((prev) => ({
                    ...prev!,
                    status: e.target.value as LocalTask["status"],
                }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
                <option value="Unassigned">Unassigned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
            </select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
            <Label htmlFor="deadline" className="text-base font-medium">
                Deadline
            </Label>
            <Input
                id="deadline"
                type="datetime-local"
                value={new Date(task.deadline).toISOString().slice(0, 16)} // Convert ISO to datetime-local format
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, deadline: e.target.value }))
                }
                className="h-11"
                required
            />
            </div>

            {/* Collaborators */}
            <div className="space-y-2">
            <Label htmlFor="collaborators" className="text-base font-medium">
                Collaborators
            </Label>
            <textarea
                id="collaborators"
                placeholder="Enter collaborator IDs, separated by commas"
                value={task.collaborators.join(", ")} // Convert array to comma-separated string
                onChange={(e) =>
                setTask((prev) => ({
                    ...prev!,
                    collaborators: e.target.value.split(",").map((id) => id.trim()), // Convert string back to array
                }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
            />
            </div>

            {/* Owner */}
            <div className="space-y-2">
            <Label htmlFor="owner" className="text-base font-medium">
                Owner
            </Label>
            <Input
                id="owner"
                type="text"
                placeholder="Enter the owner ID"
                value={task.owner}
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, owner: e.target.value }))
                }
                className="h-11"
                required
            />
            </div>

            {/* Parent Task */}
            <div className="space-y-2">
            <Label htmlFor="parent" className="text-base font-medium">
                Parent Task
            </Label>
            <Input
                id="parent"
                type="text"
                placeholder="Enter the parent task ID (optional)"
                value={task.parent || ""} // Handle null values
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, parent: e.target.value || null }))
                }
                className="h-11"
            />
            </div>
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
                disabled={!task.title.trim()}
            >
                {loading ? "Updating..." : "Update Task"}
            </Button>
            </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTask;