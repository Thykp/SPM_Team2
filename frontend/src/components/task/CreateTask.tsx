import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { TaskApi } from "@/lib/api";
import type { TaskDTO } from "@/lib/api";

interface CreateTaskProps {
  userId: string;
  onTaskCreated: (task: TaskDTO) => void;
}

const STATUSES = [
  "Unassigned",
  "Ongoing",
  "Under Review",
  "Completed",
  "Overdue",
] as const;

type StatusType = (typeof STATUSES)[number];

const CreateTask: React.FC<CreateTaskProps> = ({ userId, onTaskCreated }) => {
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: StatusType;
    priority: number;
    deadline: string;
  }>({
    title: "",
    description: "",
    status: "Unassigned",
    priority: 5, // Default priority
    deadline: new Date().toISOString().slice(0, 16), 
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () =>
    setNewTask({
      title: "",
      description: "",
      status: "Unassigned",
      priority: 5,
      deadline: new Date().toISOString().slice(0, 16),
    });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        owner: userId,
        collaborators: [],
        deadline: new Date(newTask.deadline).toISOString(),
        priority: newTask.priority,
      };

      const createdTask = await TaskApi.createTask(taskData);
      onTaskCreated(createdTask);
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    // when closing the dialog, reset the form
    if (!next) resetForm();
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateTask} className="space-y-6">
          {/* Title */}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Task Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter a detailed description of the task"
              value={newTask.description}
              onChange={(e) =>
                setNewTask((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="min-h-[96px]"
              required
            />
          </div>

          {/* Status and Priority */}
          <div className="flex gap-4">
            {/* Status */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="status" className="text-base font-medium">
                Task Status
              </Label>
              <select
                id="status"
                value={newTask.status}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, status: e.target.value as StatusType }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="priority" className="text-base font-medium">
                Priority (1-10)
              </Label>
              <select
                id="priority"
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    priority: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((priority) => {
                  let label = `${priority}`;
                  if (priority <= 3) label += " (Low)";
                  else if (priority <= 7) label += " (Medium)";
                  else label += " (High)";

                  return (
                    <option key={priority} value={priority}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-base font-medium">
              Deadline
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={newTask.deadline}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, deadline: e.target.value }))
              }
              className="h-11"
              required
            />
          </div>

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-11"
              disabled={loading || !newTask.title.trim()}
            >
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTask;
