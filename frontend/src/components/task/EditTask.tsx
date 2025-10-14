import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, Profile } from "@/lib/api";
import { X, ChevronsUpDown, Check } from "lucide-react";
// import { CollaboratorPicker } from "@/components/CollaboratorPicker";
import CollaboratorPicker from "@/components/project/CollaboratorPickerNewProj";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface LocalTask {
  id: string;
  title: string;
  deadline: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  collaborators: string[];
  owner: string | null;
  ownerName?: string;
  ownerDepartment?: string;
  parent?: string | null;
  project_id?: string | null;
  priority?: number;
  isEditingOwner?: boolean;
}

type UserRow = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

// Mock Data (to be replaced with actual API data)
const ownerOptions = [
  { value: "c0cd847d-8c61-45dd-8dda-ecffe214943e", label: "Yu Feng" },
  { value: "588fb335-9986-4c93-872e-6ef103c97f92", label: "John Doe" },
  { value: "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv", label: "Jane Smith" },
];

interface EditTaskProps {
  taskId: string; // The ID of the task to be edited
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const EditTask: React.FC<EditTaskProps> = ({ taskId, onClose }) => {
  const [task, setTask] = useState<LocalTask | null>(null); // State to store the fetched task
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]); // Add state for users
  const [userSearchTerm, setUserSearchTerm] = useState(""); // Add state for search term

  // Fetch the task details when the component is mounted
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await Task.getTaskByIdWithOwner(taskId); // Use the new function
        console.log("Fetched task data:", data);
        setTask(data); // Set the fetched task
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await Profile.getAllUsers();
        const allUsers = Array.isArray(response) ? response : (response as any).data || [];
        setUsers(allUsers);
      } catch (err) {
        console.error("Error loading users:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    fetchTask();
  }, [taskId]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!task) {
        throw new Error("Task data is missing");
      }

      const utcDeadline = new Date(task.deadline).toISOString();

      // Call the API to update the task
      const updatedTask = await Task.updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        deadline: utcDeadline,
        collaborators: task.collaborators,
        owner: task.owner,
        parent: task.parent,
        priority: task.priority || 5, // Default priority if not set
        project_id: task.project_id
      });

      console.log("Task successfully updated:", updatedTask);

      // Close the modal after updating
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatToLocalDatetime = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000); // Adjust for timezone offset
    return localDate.toISOString().slice(0, 16);
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

            {/* Status and Priority */}
            <div className="flex gap-4">
              {/* Status */}
              <div className="flex-1 space-y-2">
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

              {/* Priority */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="priority" className="text-base font-medium">
                  Priority (1-10)
                </Label>
                <select
                  id="priority"
                  value={task.priority || 5} // Default to 5 if priority is not set
                  onChange={(e) =>
                    setTask((prev) => ({
                      ...prev!,
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
                value={formatToLocalDatetime(task.deadline)}
                onChange={(e) =>
                  setTask((prev) => ({ ...prev!, deadline: e.target.value }))
                }
                className="h-11"
                required
              />
            </div>

            {/* Collaborators */}
            <div className="space-y-2">
              <CollaboratorPicker
                users={users}
                userSearchTerm={userSearchTerm}
                onUserSearchChange={setUserSearchTerm}
                selectedCollaborators={task.collaborators}
                onToggleCollaborator={(userId) => {
                  setTask((prev) => {
                    if (!prev) return prev;
                    const collaborators = prev.collaborators.includes(userId)
                      ? prev.collaborators.filter((id) => id !== userId)
                      : [...prev.collaborators, userId];
                    return { ...prev, collaborators };
                  });
                }}
                loadingUsers={loading}
                currentUserId={task.owner ?? undefined} // Exclude the owner from the collaborator list
              />
            </div>

            {/* Owner (shadcn searchable combobox) */}
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-base font-medium">
                Owner
              </Label>

              {task.isEditingOwner ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded="false"
                      className="w-full justify-between h-11"
                    >
                      {task.owner
                        ? ownerOptions.find((o) => o.value === task.owner)?.label
                        : "Select an owner"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[--radix-popper-anchor-width] p-0 z-[60]">
                    <Command>
                      <CommandInput placeholder="Search owner..." />
                      <CommandList>
                        <CommandEmpty>No owner found.</CommandEmpty>
                        <CommandGroup>
                          {ownerOptions.map((opt) => {
                            const selected = task.owner === opt.value;
                            return (
                              <CommandItem
                                key={opt.value}
                                value={opt.label}
                                onSelect={() => {
                                  setTask((prev) => ({
                                    ...prev!,
                                    owner: opt.value,
                                    ownerName: opt.label,
                                    isEditingOwner: false, // Exit editing mode
                                  }));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {opt.label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setTask((prev) => ({ ...prev!, isEditingOwner: true }))
                  }
                >
                  <span>
                    {task.ownerName}{" "}
                    {task.ownerDepartment ? `(${task.ownerDepartment})` : ""}
                  </span>
                </div>
              )}
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
