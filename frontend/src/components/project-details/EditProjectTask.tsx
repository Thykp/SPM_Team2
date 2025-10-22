import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { TaskApi, Profile, Project, type TaskPostRequestDto } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Notification as NotificationAPI } from "@/lib/api";

interface EditProjectTaskProps {
  taskId: string;
  projectId: string;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const STATUSES = [
  "Unassigned",
  "Ongoing",
  "Under Review",
  "Completed",
  "Overdue",
] as const;

type StatusType = (typeof STATUSES)[number];

const EditProjectTask: React.FC<EditProjectTaskProps> = ({
  taskId,
  projectId,
  onClose,
  onTaskUpdated,
}) => {
  const { profile } = useAuth();
  const [originalCollaborators, setOriginalCollaborators] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingTask, setFetchingTask] = useState(true);
  const [task, setTask] = useState<{
    title: string;
    description: string;
    status: StatusType;
    priority: number;
    deadline: string;
    owner: string | null;
    collaborators: string[];
    parent: string | null;
  } | null>(null);
  
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch task details and project members when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingTask(true);
        
        // Fetch the task
        const taskData = await TaskApi.getTaskByIdWithOwner(taskId);
        setTask({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority || 5,
          deadline: taskData.deadline,
          owner: taskData.owner,
          collaborators: taskData.collaborators || [],
          parent: taskData.parent || null,
        });
        setSelectedCollaborators(taskData.collaborators || []);
        setOriginalCollaborators(taskData.collaborators || []);

        // Fetch project details to get collaborators and owner
        const project = await Project.getById(projectId);

        // Fetch all users
        const allUsers = await Profile.getAllUsers();
        
        // If this is a subtask, fetch the parent task
        let parentTaskData = null;
        if (taskData.parent) {
          parentTaskData = await TaskApi.getTasksById(taskData.parent);
        }
        
        // Filter to appropriate members based on whether this is a subtask or not
        let memberIds: string[];
        if (parentTaskData) {
          // For subtasks: only show parent task's owner and collaborators
          memberIds = [
            parentTaskData.owner,
            ...(parentTaskData.collaborators || [])
          ].filter((id): id is string => id != null);
        } else {
          // For regular tasks: show all project members
          memberIds = [...(project.collaborators || []), project.owner].filter((id): id is string => id != null);
        }
        
        const members = allUsers.filter((user: any) => memberIds.includes(user.id));
        setProjectMembers(members);
      } catch (error) {
        console.error("Error fetching task or project data:", error);
      } finally {
        setFetchingTask(false);
      }
    };

    fetchData();
  }, [taskId, projectId]);

  // Filter members based on search query, excluding selected collaborators
  const filteredMembers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const availableMembers = projectMembers.filter(
      (member: any) => !selectedCollaborators.includes(member.id) && member.id !== task?.owner
    );

    if (!query) return availableMembers;

    return availableMembers.filter((member: any) =>
      [member.display_name, member.role, member.department]
        .some((field) => field?.toLowerCase().includes(query))
    );
  }, [projectMembers, searchQuery, selectedCollaborators, task?.owner]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setLoading(true);

    try {
      const taskData: TaskPostRequestDto = {
        title: task.title,
        description: task.description,
        status: task.status,
        owner: task.owner,
        collaborators: selectedCollaborators,
        deadline: new Date(task.deadline).toISOString(),
        project_id: projectId,
        parent: task.parent,
        priority: task.priority,
      };

      await TaskApi.updateTask(taskId, taskData);
      const newlyAdded = selectedCollaborators.filter((id) => !originalCollaborators.includes(id));

      if (newlyAdded.length > 0) {
        try {
          await NotificationAPI.publishAddedToResource({
            resourceType: "project-task",
            resourceId: String(taskData.project_id),
            collaboratorIds: newlyAdded,
            resourceName: taskData.title,
            resourceDescription: taskData.description || "",
            priority: taskData.priority,
            addedBy: profile?.display_name || "Unknown User",
          });
          console.log("Notifications published for new collaborators when project edited:", newlyAdded);
        } catch (notifyErr) {
          console.error("Failed to publish notification on project edited:", notifyErr);
        }
      }

      onClose();
      onTaskUpdated?.();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTask) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading Task...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!task) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Failed to load task details.</p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{task.parent ? 'Edit Subtask' : 'Edit Task'}</DialogTitle>
          {task.parent && (
            <p className="text-sm text-muted-foreground mt-1">
              Collaborators must be participants of the parent task.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleUpdateTask} className="flex flex-col flex-1 overflow-hidden">
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
                value={task.title}
                onChange={(e) =>
                  setTask((prev) => prev ? { ...prev, title: e.target.value } : null)
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
                value={task.description}
                onChange={(e) =>
                  setTask((prev) => prev ? { ...prev, description: e.target.value } : null)
                }
                className="min-h-[96px]"
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-base font-medium">
                Status
              </Label>
              <Select
                value={task.status}
                onValueChange={(value) =>
                  setTask((prev) => prev ? { ...prev, status: value as StatusType } : null)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={task.priority}
                onChange={(e) =>
                  setTask((prev) => prev ? { ...prev, priority: parseInt(e.target.value) || 5 } : null)
                }
                className="h-11"
                required
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-base font-medium">
                Deadline
              </Label>
              <Input
                id="deadline"
                type="date"
                value={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setTask((prev) => prev ? { ...prev, deadline: e.target.value } : null)
                }
                className="h-11"
                required
              />
            </div>

            {/* Owner Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-base font-medium">
                Task Owner
              </Label>
              <Select
                value={task.owner || ''}
                onValueChange={(value) =>
                  setTask((prev) => prev ? { ...prev, owner: value } : null)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select task owner" />
                </SelectTrigger>
                <SelectContent>
                  {projectMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name}
                      {member.role && ` (${member.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collaborators */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Collaborators</Label>

              {/* Selected Collaborators */}
              {selectedCollaborators.length > 0 && (
                <div className="space-y-2 mb-3">
                  {selectedCollaborators.map((collabId) => {
                    const member = projectMembers.find((m: any) => m.id === collabId);
                    if (!member) return null;
                    return (
                      <div
                        key={collabId}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span className="text-sm">
                          {member.display_name}
                          {member.role && ` (${member.role})`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCollaborators((prev) =>
                              prev.filter((id) => id !== collabId)
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search Input */}
              <Input
                type="text"
                placeholder="Search project members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10"
              />

              {/* Available Members List */}
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredMembers.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => {
                          setSelectedCollaborators((prev) => [...prev, member.id]);
                          setSearchQuery("");
                        }}
                      >
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => {
                            setSelectedCollaborators((prev) => [...prev, member.id]);
                            setSearchQuery("");
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                            {member.department && ` • ${member.department}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? "No matching members found" : "All project members added"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !task.title.trim()}>
              {loading ? "Updating..." : "Update Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectTask;
