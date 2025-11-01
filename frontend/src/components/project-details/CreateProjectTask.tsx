import React, { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronsUpDown, Check } from "lucide-react";
import { TaskApi as TaskAPI, type TaskPostRequestDto, type TaskDTO, Profile, Project } from "@/lib/api";
import { Notification as NotificationAPI } from "@/lib/api";
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
import { useAuth } from "@/contexts/AuthContext";

interface CreateProjectTaskProps {
  userId: string;
  projectId: string;
  onTaskCreated: (task: any) => void;
  parentTaskId?: string; // Optional parent task ID for creating subtasks
  triggerButton?: React.ReactNode; // Optional custom trigger button
  open?: boolean; // Optional controlled open state
  onOpenChange?: (open: boolean) => void; // Optional callback for open state changes
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
  onTaskCreated,
  parentTaskId,
  triggerButton,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const { profile } = useAuth();
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Helper function to format date for datetime-local input
  const formatToLocalDatetime = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

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
    priority: 5,
    deadline: formatToLocalDatetime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  });
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>(userId);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectCollaboratorIds, setProjectCollaboratorIds] = useState<string[]>([]);
  const [projectOwner, setProjectOwner] = useState<string>("");
  const [parentTask, setParentTask] = useState<TaskDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<{ value: string; label: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  // Fetch project details and users when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingMembers(true);
      setParentTask(null); // Reset parent task
      
      // Fetch project to get its collaborators and owner
      Project.getById(projectId)
        .then((project) => {
          setProjectCollaboratorIds(project.collaborators || []);
          setProjectOwner(project.owner);
          
          // Fetch all users
          return Profile.getAllUsers();
        })
        .then((users) => {
          setProjectMembers(users);
          
          // Store current user profile
          if (user?.id) {
            const currentUserProfile = users.find((u: any) => u.id === user.id);
            if (currentUserProfile) {
              setCurrentUser(currentUserProfile);
            }
          }
          
          // If creating a subtask, fetch the parent task
          if (parentTaskId) {
            return TaskAPI.getTasksById(parentTaskId);
          }
          return null;
        })
        .then((parentTaskData) => {
          if (parentTaskData) {
            setParentTask(parentTaskData);
          }
          setLoadingMembers(false);
        })
        .catch((err) => {
          console.error("Failed to fetch project details or users:", err);
          setLoadingMembers(false);
        });
    }
  }, [open, projectId, parentTaskId, user?.id]);

  // Filter assignable users based on current user's role and project membership
  useEffect(() => {
    const fetchAssignableUsers = async () => {
      if (!currentUser || projectMembers.length === 0) return;

      try {
        const { role: currentUserRole, team_id: currentUserTeamId, department_id: currentUserDepartmentId } = currentUser;

        // First filter: Only project members (collaborators + owner)
        const projectMemberUsers = projectMembers.filter((member: any) => 
          projectCollaboratorIds.includes(member.id) || member.id === projectOwner
        );

        // For subtasks, further filter to only parent task participants
        let eligibleMembers = projectMemberUsers;
        if (parentTaskId && parentTask) {
          const parentParticipants = [
            parentTask.owner,
            ...(parentTask.collaborators || [])
          ].filter((id): id is string => id != null);
          eligibleMembers = projectMemberUsers.filter((member: any) => 
            parentParticipants.includes(member.id)
          );
        }

        // Second filter: Apply role-based restrictions
        let filteredUsers = eligibleMembers.filter((user: any) => {
          switch (currentUserRole) {
            case "Senior Management":
              return true; // Senior Management can assign to anyone in the project
            case "Director":
              return (
                user.role !== "Senior Management" &&
                user.department_id === currentUserDepartmentId
              );
            case "Manager":
              return user.role === "Staff" && user.team_id === currentUserTeamId;
            default:
              return false; // Staff and other roles cannot assign owners
          }
        });

        // ✅ Always ensure the current user is included in the filtered users (similar to CreateTask)
        if (!filteredUsers.some((u: any) => u.id === userId)) {
          const currentUserInProject = eligibleMembers.find((user: any) => user.id === userId);
          if (currentUserInProject) {
            filteredUsers = [currentUserInProject, ...filteredUsers];
          }
        }

        // Map to owner options for the combobox
        const options = filteredUsers.map((user: any) => ({
          value: user.id,
          label: user.display_name,
        }));

        setOwnerOptions(options);
        setAssignableUsers(filteredUsers);

        // ✅ Set current user as default owner if not already set (similar to CreateTask)
        if (!selectedOwner && filteredUsers.some((u: any) => u.id === userId)) {
          setSelectedOwner(userId);
        }
      } catch (err) {
        console.error("Error fetching assignable users:", err);
      }
    };

    fetchAssignableUsers();
  }, [currentUser, projectMembers, projectCollaboratorIds, projectOwner, parentTaskId, parentTask, userId, selectedOwner]);

  // Filter members based on search query and project membership
  const filteredMembers = useMemo(() => {
    // If creating a subtask, only show parent task's collaborators and owner
    // Otherwise, show project collaborators and owner
    let eligibleMemberIds: string[];
    
    if (parentTaskId && parentTask) {
      // For subtasks: only parent task's owner and collaborators
      const parentParticipants = [
        parentTask.owner,
        ...(parentTask.collaborators || [])
      ].filter((id): id is string => id != null);
      eligibleMemberIds = parentParticipants;
    } else {
      // For regular tasks: project collaborators and owner
      eligibleMemberIds = [
        ...projectCollaboratorIds,
        projectOwner
      ].filter((id): id is string => id != null);
    }
    
    const eligibleMembers = projectMembers.filter((member: any) => 
      eligibleMemberIds.includes(member.id)
    );
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Only exclude the selected owner, not the current user
      return eligibleMembers.filter((member: any) => member.id !== selectedOwner);
    }
    
    return eligibleMembers
      .filter((member: any) => member.id !== selectedOwner) // Only exclude selected owner
      .filter((member: any) =>
        [member.display_name, member.role, member.department]
          .some((field) => field?.toLowerCase().includes(query))
      );
  }, [projectMembers, searchQuery, projectCollaboratorIds, projectOwner, selectedOwner, parentTaskId, parentTask]);

  const resetForm = () => {
    setNewTask({ 
      title: "", 
      description: "", 
      status: "Unassigned",
      priority: 5,
      deadline: formatToLocalDatetime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    });
    setSelectedCollaborators([]);
    setSelectedOwner(userId);
    setSearchQuery("");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!newTask.title.trim()) {
        setError("Please fill in the title");
        setLoading(false);
        return;
      }

      if (!newTask.description.trim()) {
        setError("Please fill in the description");
        setLoading(false);
        return;
      }

      // Deadline validation is handled by inline validation

      // If the current user assigns the task to someone else, add them to collaborators
      let finalCollaborators = selectedCollaborators;
      if (selectedOwner && selectedOwner !== userId && !selectedCollaborators.includes(userId)) {
        finalCollaborators = [...selectedCollaborators, userId];
      }

      const taskData: TaskPostRequestDto = {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        owner: selectedOwner, // Use selected owner or default to current user
        collaborators: finalCollaborators,
        deadline: new Date(newTask.deadline).toISOString(),
        priority: newTask.priority,
        project_id: projectId,
        parent: parentTaskId || null, // Add parent task ID if creating a subtask
      };

      const createdTask = await TaskAPI.createTask(taskData);
      onTaskCreated(createdTask);
      setOpen(false);

      // Notify collaborators upon creation
      if (selectedCollaborators.length > 0) {
        const payload = {
          resourceType: "project",
          resourceId: String(taskData.project_id),
          resourceContent: { ...taskData },
          collaboratorIds: taskData.collaborators,
          addedBy: profile?.display_name || "Unknown User",
        };

        console.log("Publishing notifications for project task creation:", payload);

        try {
          const notifResponse = await NotificationAPI.publishAddedToResource(payload);
          console.log("Notification published upon creating project task:", notifResponse);
        } catch (notifErr) {
          console.error("Failed to publish notification upon creating project task:", notifErr);
        }
      } else {
        console.log("No collaborators selected — no notification sent upon creating project task.");
      }
      resetForm();
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

  const handleOpenChange = (next: boolean) => {
    // when closing the dialog, reset the form
    if (!next) resetForm();
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{parentTaskId ? 'Create Subtask' : 'Create Project Task'}</DialogTitle>
          <DialogDescription>
            {parentTaskId 
              ? 'Create a new subtask. It will be linked to the parent task. Collaborators must be participants of the parent task.'
              : 'Create a new task for this project. The task will be automatically linked to the current project.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateTask} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 space-y-6">
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
            <div className="flex-1 space-y-2">
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

            <div className="flex-1 space-y-2">
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
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-base font-medium">
              Task Deadline
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
              value={newTask.deadline}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                const now = new Date();

                if (selectedDate < now) {
                  setDeadlineError("Deadline cannot be in the past");
                } else {
                  setDeadlineError(null);
                }

                setNewTask((prev) => ({ ...prev, deadline: e.target.value }));
              }}
              className="h-11"
              required
            />
            {deadlineError && <p className="text-red-500 text-sm">{deadlineError}</p>}
          </div>

          {/* Collaborators */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Collaborators (Optional)
            </Label>
            <div className="border rounded-lg p-3 space-y-3">
              <Input
                placeholder="Search by name, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10"
              />
              <div className="max-h-48 overflow-y-auto space-y-2">
                {loadingMembers ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Loading members...
                  </p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {searchQuery ? "No members found" : "No collaborators available"}
                  </p>
                ) : (
                  filteredMembers
                    // Remove this line: .filter((member: any) => member.id !== selectedOwner && member.id !== userId)
                    .map((member: any) => (
                      <label
                        key={member.id}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCollaborators.includes(member.id)}
                          onCheckedChange={() => {
                            setSelectedCollaborators((prev) =>
                              prev.includes(member.id)
                                ? prev.filter((id) => id !== member.id)
                                : [...prev, member.id]
                            );
                          }}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{member.display_name}</div>
                          <div className="text-muted-foreground">
                            {member.role} • {member.department || "—"}
                          </div>
                        </div>
                      </label>
                    ))
                )}
              </div>
              {selectedCollaborators.length > 0 && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {selectedCollaborators.length} collaborator{selectedCollaborators.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label htmlFor="owner" className="text-base font-medium">
              Task Owner
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
                      const triggerWidth = el.offsetWidth;
                      document.documentElement.style.setProperty(
                        "--popover-width",
                        `${triggerWidth}px`
                      );
                    }
                  }}
                >
                  {selectedOwner
                    ? ownerOptions.find((o) => o.value === selectedOwner)?.label || "Select an owner"
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
                      {assignableUsers.map((user: any) => {
                        const selected = selectedOwner === user.id;
                        return (
                          <CommandItem
                            key={user.id}
                            value={user.display_name}
                            onSelect={() => {
                              console.log("Selected Owner:", user);
                              setSelectedOwner(user.id);
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

          </div> {/* End scrollable content */}

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-11"
              disabled={loading || !newTask.title.trim() || !!deadlineError}
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