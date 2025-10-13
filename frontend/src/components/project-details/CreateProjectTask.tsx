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
import { TaskApi as TaskAPI, type TaskPostRequestDto } from "@/lib/api";

interface CreateProjectTaskProps {
  userId: string;
  projectId: string;
  onTaskCreated: (task: any) => void;
}

const STATUSES = [
  "Unassigned",
  "Ongoing", 
  "Under Review",
  "Completed",
  "Overdue",
] as const;

type StatusType = (typeof STATUSES)[number];

const CreateProjectTask: React.FC<CreateProjectTaskProps> = ({ 
  userId, 
  projectId, 
  onTaskCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: StatusType;
    priority: number;
  }>({
    title: "",
    description: "",
    status: "Unassigned",
    priority: 5,
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () =>
    setNewTask({ 
      title: "", 
      description: "", 
      status: "Unassigned",
      priority: 5,
    });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create task data in TaskPostRequestDto format
      const taskData: TaskPostRequestDto = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        owner: userId,
        collaborators: [],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days from now
        project_id: projectId, // Include project ID
        parent: null,
        priority: newTask.priority,
      };

      console.log('Creating task with data:', taskData);

      // Use the new createTaskWithProjectData API method
      const response = await TaskAPI.createTask(taskData);
      
      console.log('Task created successfully:', response);
      onTaskCreated(response);
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Failed to create task:", err);
      // You could add error toast here
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
          <DialogTitle>Create Project Task</DialogTitle>
          <DialogDescription>
            Create a new task for this project. The task will be automatically linked to the current project.
          </DialogDescription>
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

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">
              Initial Status
            </Label>
            <Select
              value={newTask.status}
              onValueChange={(val: StatusType) =>
                setNewTask((prev) => ({ ...prev, status: val }))
              }
            >
              <SelectTrigger id="status" className="h-11">
                <SelectValue placeholder="Select initial status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-base font-medium">
              Priority (1-10)
            </Label>
            <Select
              value={newTask.priority.toString()}
              onValueChange={(val: string) =>
                setNewTask((prev) => ({ ...prev, priority: parseInt(val) }))
              }
            >
              <SelectTrigger id="priority" className="h-11">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((priority) => {
                  let label = `${priority}`;
                  if (priority <= 3) label += ' (Low)';
                  else if (priority <= 7) label += ' (Medium)';
                  else label += ' (High)';
                  
                  return (
                    <SelectItem key={priority} value={priority.toString()}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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

export default CreateProjectTask;