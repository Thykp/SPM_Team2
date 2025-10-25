import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskApi, Profile } from "@/lib/api";
import { X, ChevronsUpDown, Check } from "lucide-react";
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

type UserRow = {
  id: string;
  display_name: string;
  role: string;
  department: string;
  team: string | null;
};

interface CreateTaskProps {
  userId: string;
  onTaskCreated: (task: any) => void;
  onClose: () => void;
}

const STATUSES = [
  "Unassigned",
  "Ongoing",
  "Under Review",
  "Completed",
  "Overdue",
] as const;

type StatusType = (typeof STATUSES)[number];

const formatToLocalDatetime = (dateString: string) => {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000); // Adjust for timezone offset
  return localDate.toISOString().slice(0, 16);
};

const CreateTask: React.FC<CreateTaskProps> = ({ userId, onTaskCreated, onClose }) => {
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: StatusType;
    priority: number;
    deadline: string;
    owner: string;
    collaborators: string[];
  }>({
    title: "",
    description: "",
    status: "Unassigned",
    priority: 5,
    deadline: formatToLocalDatetime(new Date().toISOString()),
    owner: userId,
    collaborators: [],
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<{ value: string; label: string }[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<UserRow[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignableUsers = async () => {
      try {
        const response = await Profile.getAllUsers();
        const allUsers = Array.isArray(response) ? response : (response as any).data || [];
        setUsers(allUsers);

        // Find the current user's profile
        const currentUserProfile = allUsers.find((user: UserRow) => user.id === userId);
        console.log("Current User Profile:", currentUserProfile); // Debugging log

        if (!currentUserProfile) {
          console.error("Current user profile not found");
          return;
        }

        const { role: currentUserRole, team: currentUserTeamId, department: currentUserDepartmentId } = currentUserProfile;
        console.log("Current User Role:", currentUserRole);
        console.log("Current User Team ID:", currentUserTeamId);
        console.log("Current User Department ID:", currentUserDepartmentId);

        // Filter assignable users based on the current user's role
        let filteredUsers = allUsers.filter((user: UserRow) => {
          console.log("Checking User:", user); // Debugging log
          switch (currentUserRole) {
            case "Senior Management":
              return true; // Senior Management can assign anyone
            case "Director":
              return (
                user.role !== "Senior Management" &&
                user.department === currentUserDepartmentId
              );
            case "Manager":
              return user.role === "Staff" && user.team === currentUserTeamId;
            default:
              return false; // Other roles cannot assign owners
          }
        });

        console.log("Filtered Users:", filteredUsers); // Debugging log

        // Ensure the current user is included in the filtered users
        if (!filteredUsers.some((user: UserRow) => user.id === userId)) {
          const currentUser = allUsers.find((user: UserRow) => user.id === userId);
          if (currentUser) {
            filteredUsers = [currentUser, ...filteredUsers];
          }
        }

        setAssignableUsers(filteredUsers);
        setOwnerOptions(
          filteredUsers.map((user: UserRow) => ({
            value: user.id,
            label: user.display_name,
          }))
        );
      } catch (err) {
        console.error("Error fetching assignable users:", err);
      }
    };

    fetchAssignableUsers();
  }, [userId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); 

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        owner: newTask.owner,
        collaborators: newTask.collaborators,
        deadline: new Date(newTask.deadline).toISOString(),
        priority: newTask.priority,
      };

      const createdTask = await TaskApi.createTask(taskData);
      onTaskCreated(createdTask);
      onClose();
    } catch (err: any) {
        console.error("Failed to create task:", err);

        if (err.response && err.response.data) {
          try {
            const errorData = typeof err.response.data === "string"
              ? JSON.parse(err.response.data) // Parse if it's a string
              : err.response.data;

            if (errorData.error) {
              setError(errorData.error); // Use the error message from the backend
            } else {
              setError("An unexpected error occurred."); // Fallback if no error field exists
            }
          } catch (parseError) {
            console.error("Error parsing response data:", parseError);
            setError("An unexpected error occurred."); // Fallback for parsing errors
          }
        } else if (err.message) {
          setError(err.message); // Use the generic error message
        } else {
          setError("An unexpected error occurred."); // Fallback for unknown errors
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Create Task</CardTitle>
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
            {/* Error Message */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            {/* Description */}
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

            {/* Status and Priority */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="status" className="text-base font-medium">
                  Task Status
                </Label>
                <select
                  id="status"
                  value={newTask.status}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      status: e.target.value as StatusType,
                    }))
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
                value={formatToLocalDatetime(newTask.deadline)}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, deadline: e.target.value }))
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
                selectedCollaborators={newTask.collaborators}
                onToggleCollaborator={(userId) => {
                  setNewTask((prev) => {
                    const collaborators = prev.collaborators.includes(userId)
                      ? prev.collaborators.filter((id) => id !== userId)
                      : [...prev.collaborators, userId];
                    return { ...prev, collaborators };
                  });
                }}
                loadingUsers={loading}
                currentUserId={newTask.owner ?? undefined}
              />
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-base font-medium">
                Owner
              </Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded="false"
                    className="w-full justify-between h-11"
                  >
                    {newTask.owner
                      ? ownerOptions.find((o) => o.value === newTask.owner)?.label || "Select an owner"
                      : "Select an owner"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 z-[60]">
                  <Command>
                    <CommandInput placeholder="Search owner..." />
                    <CommandList>
                      <CommandEmpty>No owner found.</CommandEmpty>
                      <CommandGroup>
                        {assignableUsers.map((user) => {
                          const selected = newTask.owner === user.id;
                          return (
                            <CommandItem
                              key={user.id}
                              value={user.display_name}
                              onSelect={() => {
                                setNewTask((prev) => ({
                                  ...prev,
                                  owner: user.id,
                                }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {user.display_name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

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
                disabled={!newTask.title.trim()}
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTask;