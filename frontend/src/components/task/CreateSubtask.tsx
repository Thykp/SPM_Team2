import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose } from "@/components/ui/dialog";
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
import { TaskApi as TaskAPI, type TaskPostRequestDto, type TaskDTO, Profile } from "@/lib/api";
import { Check, ChevronsUpDown } from "lucide-react";

const STATUSES = [
  "Unassigned",
  "Ongoing",
  "Under Review",
  "Completed",
  "Overdue",
] as const;

type StatusType = (typeof STATUSES)[number];

interface CreateSubtaskProps {
  parentTaskId: string; // Parent task ID for linking the subtask
  projectId: string;
  parentTaskCollaborators: string[]; // Collaborators from the parent task
  onSubtaskCreated: (subtask: TaskDTO) => void; // Callback when a subtask is created
  open: boolean; // Controlled open state
  onOpenChange: (open: boolean) => void; // Callback for open state changes
  currentUserId: string; // ID of the current user
}

  const formatToLocalDatetime = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000); // Adjust for timezone offset
    return localDate.toISOString().slice(0, 16);
  };

const CreateSubtask: React.FC<CreateSubtaskProps> = ({
  parentTaskId,
  projectId, 
  parentTaskCollaborators,
  onSubtaskCreated,
  open,
  onOpenChange,
  currentUserId,
}) => {
  const [newSubtask, setNewSubtask] = useState<{
    title: string;
    description: string;
    status: StatusType;
    priority: number;
    deadline: string;
    collaborators: string[];
    owner: string | null;
  }>({
    title: "",
    description: "",
    status: "Unassigned",
    priority: 5,
    deadline: formatToLocalDatetime(new Date().toISOString()), // Default to 1 week from now
    collaborators: [currentUserId], // Pre-fill with the current user
    owner: currentUserId, // Set the current user as the default owner
  });

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // List of users for collaborators and owner
  const [userSearchTerm, setUserSearchTerm] = useState(""); // Search term for filtering users
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for fetching users
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]); // Filtered list of assignable users
  const [ownerOptions, setOwnerOptions] = useState<{ value: string; label: string }[]>([]); // Owner dropdown options

  useEffect(() => {
    const fetchAssignableUsers = async () => {
        setLoadingUsers(true);
        try {
        // Fetch all users
        const allUsers = await Profile.getAllUsers();
        console.log("All Users:", allUsers);

        // Find the current user's profile
        const currentUserProfile = allUsers.find((user) => user.id === currentUserId);
        if (!currentUserProfile) {
            console.error("Current user profile not found");
            return;
        }

        const { role: currentUserRole, team_id: currentUserTeamId, department_id: currentUserDepartmentId } = currentUserProfile;

        console.log("Current User Role:", currentUserRole);
        console.log("Current User Department ID:", currentUserDepartmentId);
        console.log("Current User Team ID:", currentUserTeamId);

      // Filter users to include only those in the parent task's collaborators
      const filteredCollaborators= allUsers.filter((user) =>
        parentTaskCollaborators.includes(user.id)
      );

      setUsers(filteredCollaborators); // Set the filtered users as collaborators
      console.log("Filtered Collaborators:", filteredCollaborators);

        // Owners: Filter based on the current user's role
        let filteredUsers = allUsers.filter((user) => {
            switch (currentUserRole) {
            case "Senior Management":
                return true; // Senior Management can assign anyone
            case "Director":
                return (
                user.role !== "Senior Management" &&
                user.department_id === currentUserDepartmentId
                );
            case "Manager":
                return user.role === "Staff" && user.team_id === currentUserTeamId;
            default:
                return false; // Other roles cannot assign owners
            }
        });

        // Ensure the current user is included in the filtered users
        if (!filteredUsers.some((user) => user.id === currentUserId)) {
            filteredUsers = [currentUserProfile, ...filteredUsers];
        }

        console.log("Filtered Users (Owners):", filteredUsers);

        // Map assignable users to ownerOptions
        const options = filteredUsers.map((user) => ({
            value: user.id,
            label: user.display_name,
        }));

        setAssignableUsers(filteredUsers); // Store the filtered users for owner assignment
        setOwnerOptions(options); // Set the owner dropdown options
        } catch (err) {
        console.error("Error fetching assignable users:", err);
        } finally {
        setLoadingUsers(false);
        }
    };

    fetchAssignableUsers();
  }, [currentUserId, parentTaskCollaborators]);

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subtaskData: TaskPostRequestDto = {
        title: newSubtask.title,
        description: newSubtask.description,
        status: newSubtask.status,
        priority: newSubtask.priority,
        deadline: new Date(newSubtask.deadline).toISOString(),
        collaborators: newSubtask.collaborators,
        owner: newSubtask.owner,
        parent: parentTaskId, // Link to the parent task
        project_id: projectId || "",
      };

      console.log("Subtask Data Sent to API:", subtaskData); // Debugging log

      const createdSubtask = await TaskAPI.createTask(subtaskData);
      onSubtaskCreated(createdSubtask); // Notify parent component
      onOpenChange(false); // Close the modal
      setNewSubtask({
        title: "",
        description: "",
        status: "Unassigned",
        priority: 5,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        collaborators: [currentUserId], // Reset to the current user
        owner: currentUserId, // Reset to the current user
      });
    } catch (err) {
      console.error("Failed to create subtask:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Create Subtask</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[50vh]">
            <form onSubmit={handleCreateSubtask} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Subtask Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter a descriptive subtask title"
                  value={newSubtask.title}
                  onChange={(e) =>
                    setNewSubtask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="h-11"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Subtask Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter a detailed description of the subtask"
                  value={newSubtask.description}
                  onChange={(e) =>
                    setNewSubtask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                  required
                />
              </div>

            {/* Priority and Status */}
            <div className="flex gap-4">

            {/* Status */}
            <div className="flex-1 space-y-2">
                <Label htmlFor="status" className="text-base font-medium">
                Subtask Status
                </Label>
                <select
                id="status"
                value={newSubtask.status}
                onChange={(e) =>
                    setNewSubtask((prev) => ({
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


            {/* Priority */}
            <div className="flex-1 space-y-2">
                <Label htmlFor="priority" className="text-base font-medium">
                Priority
                </Label>
                <select
                id="priority"
                value={newSubtask.priority}
                onChange={(e) =>
                    setNewSubtask((prev) => ({
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
                  value={newSubtask.deadline}
                  onChange={(e) =>
                    setNewSubtask((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                  className="h-11"
                  required
                />
              </div>

              {/* Collaborators */}
              <div className="space-y-2">
                <CollaboratorPicker
                  users={users}
                  selectedCollaborators={newSubtask.collaborators}
                  onToggleCollaborator={(userId) => {
                    setNewSubtask((prev) => {
                      const collaborators = prev.collaborators.includes(userId)
                        ? prev.collaborators.filter((id) => id !== userId)
                        : [...prev.collaborators, userId];
                      return { ...prev, collaborators };
                    });
                  }}
                  userSearchTerm={userSearchTerm}
                  onUserSearchChange={setUserSearchTerm}
                  loadingUsers={loadingUsers}
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
                      {newSubtask.owner
                        ? ownerOptions.find((o) => o.value === newSubtask.owner)?.label ||
                          "Select an owner"
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
                            const selected = newSubtask.owner === user.id;
                            return (
                              <CommandItem
                                key={user.id}
                                value={user.display_name}
                                onSelect={() => {
                                  setNewSubtask((prev) => ({
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
            </form>
          </CardContent>
          <CardFooter className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11"
              disabled={!newSubtask.title.trim()}
              onClick={handleCreateSubtask}
            >
              {loading ? "Creating..." : "Create Subtask"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Dialog>
  );
};

export default CreateSubtask;