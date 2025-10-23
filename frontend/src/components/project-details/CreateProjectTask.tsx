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
import { Plus } from "lucide-react";
import { TaskApi as TaskAPI, type TaskPostRequestDto, type TaskDTO, Profile, Project } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Notification as NotificationAPI } from "@/lib/api";

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
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
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
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days from now, formatted as YYYY-MM-DD
  });
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectCollaboratorIds, setProjectCollaboratorIds] = useState<string[]>([]);
  const [projectOwner, setProjectOwner] = useState<string>("");
  const [parentTask, setParentTask] = useState<TaskDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch project details and users when dialog opens
  useEffect(() => {
    if (open) {
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
        })
        .catch((err) => {
          console.error("Failed to fetch project details or users:", err);
        });
    }
  }, [open, projectId, parentTaskId]);

  // Filter members based on search query and project membership
  const filteredMembers = useMemo(() => {
    // If creating a subtask, only show parent task's collaborators and owner
    // Otherwise, show project collaborators and owner
    let eligibleMemberIds: string[];
    
    if (parentTaskId && parentTask) {
      // For subtasks: only parent task's owner and collaborators (excluding current user)
      const parentParticipants = [
        parentTask.owner,
        ...(parentTask.collaborators || [])
      ].filter((id): id is string => id != null && id !== userId);
      eligibleMemberIds = parentParticipants;
    } else {
      // For regular tasks: project collaborators and owner (excluding current user)
      eligibleMemberIds = [
        ...projectCollaboratorIds,
        projectOwner
      ].filter((id): id is string => id != null && id !== userId);
    }
    
    const eligibleMembers = projectMembers.filter((member: any) => 
      eligibleMemberIds.includes(member.id)
    );
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return eligibleMembers;
    
    return eligibleMembers.filter((member: any) =>
      [member.display_name, member.role, member.department]
        .some((field) => field?.toLowerCase().includes(query))
    );
  }, [projectMembers, searchQuery, projectCollaboratorIds, projectOwner, userId, parentTaskId, parentTask]);

  const resetForm = () => {
    setNewTask({ 
      title: "", 
      description: "", 
      status: "Unassigned",
      priority: 5,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setSelectedCollaborators([]);
    setSearchQuery("");
  };

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
        collaborators: selectedCollaborators, // Include selected collaborators
        deadline: new Date(newTask.deadline).toISOString(), // User-selected deadline
        project_id: projectId, // Include project ID
        parent: parentTaskId || null, // Use parent task ID if creating subtask
        priority: newTask.priority,
      };

      console.log('Creating task with data:', taskData);

      // Use the new createTaskWithProjectData API method
      const response = await TaskAPI.createTask(taskData);

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

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-base font-medium">
              Task Deadline
            </Label>
            <Input
              id="deadline"
              type="date"
              value={newTask.deadline}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, deadline: e.target.value }))
              }
              min={new Date().toISOString().split('T')[0]}
              className="h-11"
              required
            />
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
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {searchQuery ? "No members found" : "Loading members..."}
                  </p>
                ) : (
                  filteredMembers
                    .filter((member: any) => member.id !== userId) // Exclude the task owner
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