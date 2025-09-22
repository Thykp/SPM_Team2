import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { Task } from "@/lib/api"; // Import the Task service

interface CreateTaskProps {
  userId: string; // Add userId as a prop
  onTaskCreated: (task: Task) => void; // Callback to update the task list in the parent component
}

const CreateTask: React.FC<CreateTaskProps> = ({ userId, onTaskCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  }>({
    title: "",
    description: "",
    status: "Unassigned", // Default status
  });
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        owner: userId, // Use the userId passed as a prop
        collaborators: [],
        deadline: new Date().toISOString(),
      };

      const createdTask = await Task.createTask(taskData); // Call the API to create the task
      onTaskCreated(createdTask); // Notify the parent component
      setNewTask({ title: "", description: "", status: "Unassigned" }); // Reset the form
      setShowModal(false); // Close the modal
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setNewTask({ title: "", description: "", status: "Unassigned" });
  };

  return (
    <>
      {/* Create New Task Button */}
      <Button onClick={() => setShowModal(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Task
      </Button>

      {/* Create New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Create New Task</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleModalClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">
                    Task Title
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter a descriptive task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                    Task Description
                </Label>
                <textarea
                    id="description"
                    placeholder="Enter a detailed description of the task"
                    value={newTask.description}
                    onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                    required
                />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-medium">
                    Task Status
                  </Label>
                  <select
                    id="status"
                    value={newTask.status}
                    onChange={(e) =>
                    setNewTask((prev) => ({
                        ...prev,
                        status: e.target.value as "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue",
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
                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleModalClose}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11"
                    disabled={!newTask.title.trim()}
                  >
                    {loading ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default CreateTask;