// add code such that it stores orignialcollaborators, then sees newly added collaborators. if have, send a notification to them with the correct payload.

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskApi, Profile } from "@/lib/api";
import { X, ChevronsUpDown, Check } from "lucide-react";
// import { CollaboratorPicker } from "@/components/CollaboratorPicker";
import CollaboratorPicker from "@/components/project/CollaboratorPickerNewProj";
import { useAuth } from "@/contexts/AuthContext";
import { Notification as NotificationAPI } from "@/lib/api";

import { Project } from "@/lib/api";
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
  team: string | null;
};

interface EditTaskProps {
  taskId: string; // The ID of the task to be edited
  currentUserId: string; // The current user's ID
  parentTaskCollaborators?: string[]; // Collaborators from the parent task (optional)
  projectId?: string | null; // The project ID (optional)
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const EditTask: React.FC<EditTaskProps> = ({ taskId, currentUserId, parentTaskCollaborators, projectId, onClose, onTaskUpdated }) => {
  const { profile } = useAuth();
  const [originalCollaborators, setOriginalCollaborators] = useState<string[]>([]);
  const [originalTask, setOriginalTask] = useState<LocalTask>();
  const [task, setTask] = useState<LocalTask | null>(null); // State to store the fetched task
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]); // Add state for users
  const [userSearchTerm, setUserSearchTerm] = useState(""); // Add state for search term
  const [ownerOptions, setOwnerOptions] = useState<{ value: string; label: string }[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<UserRow[]>([]);
  const [currentUser, setCurrentUser] = useState<UserRow | null>(null);
  const [error, setError] = useState<string | null>(null); // State to store error messages
  const isOwner = task?.owner === currentUserId;



  // Fetch the task details when the component is mounted
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await TaskApi.getTaskByIdWithOwner(taskId); // Fetch the task
        console.log("Fetched task data:", data);
        setTask(data); // Set the fetched task
        setOriginalTask(data)
        setOriginalCollaborators(data.collaborators || []); // store original collaborators

        // Find and store the original owner in `currentUser`
        if (data.owner) {
          const allUsers = await Profile.getAllUsers();
          const originalOwner = allUsers.find((user) => user.id === data.owner);
          if (originalOwner) {
            setCurrentUser(originalOwner); // Store the original owner
          }
        }
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await Profile.getAllUsers();
        console.log("Fetched Users:", response);
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

  useEffect(() => {
    const fetchAssignableUsers = async () => {
      try {
        // Fetch all users
        const allUsers = await Profile.getAllUsers();
        console.log("All Users:", allUsers);
        console.log("Parent Task Collaborators:", parentTaskCollaborators);

        // Find the current user's profile
        const currentUserProfile = allUsers.find((user) => user.id === currentUserId);
        if (!currentUserProfile) {
          console.error("Current user profile not found");
          return;
        }

        console.log("Current User Profile:", currentUserProfile);

        const { role: currentUserRole, team_id: currentUserTeamId, department_id: currentUserDepartmentId } = currentUserProfile;

        // Initialize filtered collaborators
        let filteredCollaborators = allUsers;

        // Check if the task is under a project
        if (projectId) {
          try {
            // Fetch project collaborators
            const project = await Project.getById(projectId);
            console.log("Project Collaborators:", project.collaborators);

            // Filter collaborators based on the project collaborators
            filteredCollaborators = allUsers.filter((user) =>
              project.collaborators.includes(user.id)
            );
          } catch (error) {
            console.error("Error fetching project collaborators:", error);
          }
        } else if (task?.parent) {
          // If the task is a subtask, filter collaborators based on the parent task's collaborators
          filteredCollaborators = allUsers.filter((user) =>
            parentTaskCollaborators?.includes(user.id)
          );
        }

        setUsers(filteredCollaborators); // Set the filtered users for the CollaboratorPicker
        console.log("Filtered Collaborators:", filteredCollaborators);

        // Filter assignable users based on the current user's role
        let filteredUsers = filteredCollaborators.filter((user) => {
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

        // Ensure the original owner (currentUser) is included in the filtered users
        if (currentUser && !filteredUsers.some((user) => user.id === currentUser.id)) {
          filteredUsers = [currentUser, ...filteredUsers];
        }

        console.log("Filtered Users (assignableUsers):", filteredUsers);

        // Map assignable users to ownerOptions
        const options = filteredUsers.map((user) => ({
          value: user.id,
          label: user.display_name,
        }));
        console.log("Owner Options:", options);

        setOwnerOptions(options);
        setAssignableUsers(filteredUsers); // Store the filtered users for the owner dropdown
      } catch (err) {
        console.error("Error fetching assignable users:", err);
      }
    };

    fetchAssignableUsers();
  }, [currentUserId, task, currentUser, parentTaskCollaborators]); // Add `parentTaskCollaborators` as a dependency

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!task) {
        throw new Error("Task data is missing");
      }

      const utcDeadline = new Date(task.deadline).toISOString();

      // Call the API to update the task
      const updatedTask = await TaskApi.updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        deadline: utcDeadline,
        collaborators: task.collaborators,
        owner: task.owner,
        parent: task.parent,
        priority: task.priority || 5, // Default priority if not set
        project_id: task.project_id || null, // Preserve the original project_id
      });

      console.log("Task successfully updated:", updatedTask);

      const updatedTaskDetails = {
        title: task.title,
        description: task.description,
        status: task.status,
        deadline: utcDeadline,
        collaborators: task.collaborators,
        owner: task.owner,
        parent: task.parent,
        priority: task.priority || 5, // Default priority if not set
        project_id: task.project_id || null, // Preserve the original project_id
      }

      // Close the modal after updating
      onClose();

      // --- Notify collaborators when newly added ---
      const newlyAdded = updatedTaskDetails.collaborators.filter((id) => !originalCollaborators.includes(id));
      if (newlyAdded.length > 0) {
        try {
          await NotificationAPI.publishAddedToResource({
            resourceType: "task",
            resourceId: taskId,
            collaboratorIds: newlyAdded,
            resourceContent: {...updatedTaskDetails},
            addedBy: profile?.display_name || "Unknown User",
          });
          console.log("Notifications published for new collaborators when project edited:", newlyAdded);
        } catch (notifyErr) {
          console.error("Failed to publish notification on project edited:", notifyErr);
        }
      }

        // --- Notify collaborators about edits ---
    const collaboratorsToNotify = updatedTaskDetails.collaborators.filter(id => id !== profile?.id);
    if (collaboratorsToNotify.length > 0 && originalTask) {
      const hasNonOwnerChanges = (
        originalTask.title !== updatedTaskDetails.title ||
        originalTask.description !== updatedTaskDetails.description ||
        originalTask.status !== updatedTaskDetails.status ||
        originalTask.priority !== updatedTaskDetails.priority ||
        originalTask.deadline !== updatedTaskDetails.deadline.replace(".000Z", "+00:00"))

      if (hasNonOwnerChanges) {
        await NotificationAPI.publishUpdate({
          updateType: "Edited",
          resourceType: "task",
          resourceId:taskId,
          resourceContent: { 
            updated: {...updatedTaskDetails},
            original: {...originalTask}
          },
          collaboratorIds: collaboratorsToNotify,
          updatedBy: profile?.display_name || "Unknown User",
        });
        console.log(JSON.stringify({updateType: "Edited",
          resourceType: "task",
          resourceId:taskId,
          resourceContent: { 
            updated: {...updatedTaskDetails},
            original: {...originalTask}
          },
          collaboratorIds: collaboratorsToNotify,
          updatedBy: profile?.display_name || "Unknown User",}))
      }  
    }
      // --- Notify new owner of assignment---
      if (originalTask?.owner !== updatedTaskDetails.owner && updatedTaskDetails.owner) {
        await NotificationAPI.publishUpdate({
          updateType: "Assigned",
          resourceType: "task",
            resourceId:taskId,
            resourceContent: {
              updated: {...updatedTaskDetails},
              original: {...originalTask}
            },
            collaboratorIds: [updatedTaskDetails.owner],
            updatedBy: profile?.display_name || "Unknown User",
        });
      }

      if (typeof onTaskUpdated === "function") onTaskUpdated();
    } catch (err: any) {
      console.error("Failed to update task:", err);

      if (err.response && err.response.data) {
        try {
          // Parse the response data
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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
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
                disabled={!isOwner}
              />
                {!isOwner && (
                  <p className="text-sm text-gray-500">
                    Only the task owner can modify the deadline.
                  </p>
                )}
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
                disabled={!isOwner}
              />
                {!isOwner && (
                  <p className="text-sm text-gray-500">
                    Only the task owner can modify the collaborators.
                  </p>
                )}
            </div>

{/* Owner (shadcn searchable combobox) */}
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
        ref={(el) => {
          if (el) {
            const triggerWidth = el.offsetWidth; // Get the width of the trigger
            document.documentElement.style.setProperty(
              "--popover-width",
              `${triggerWidth}px`
            );
          }
        }}
      >
        {task.owner
          ? ownerOptions.find((o) => o.value === task.owner)?.label || "Select an owner"
          : "Select an owner"}
        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      className="p-0 z-[60]"
      style={{ width: "var(--popover-width)" }}
    >
      <Command>
        <CommandInput placeholder="Search owner..." />
        <CommandList>
          <CommandEmpty>No owner found.</CommandEmpty>
            <CommandGroup>
              {assignableUsers.map((user) => {
                const selected = task.owner === user.id;
                return (
                  <CommandItem
                    key={user.id}
                    value={user.display_name}
                    onSelect={() => {
                      console.log("Selected Owner:", user);
                      setTask((prev) => ({
                        ...prev!,
                        owner: user.id,
                        ownerName: user.display_name,
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
