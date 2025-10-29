import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, GripVertical, MoreVertical, Trash2, Edit, Plus, Gauge } from 'lucide-react';
import { type TaskDTO, TaskApi } from '@/lib/api';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { TaskDetailNavigator } from '@/components/task/TaskDetailNavigator';
import { TaskReminder } from '../task/TaskReminder';
import { RecurTask } from '@/components/task/RecurTask';
import EditTask from '@/components/task/EditTask';
import CreateSubtask from '@/components/task/CreateSubtask';

interface TaskCardProps {
    task: TaskDTO;
    projectId: string;
    userId: string;
    isDragging?: boolean;
    onTaskDeleted?: (taskId: string) => void;
    onTaskUpdated?: () => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Unassigned':
            return 'bg-gray-100 text-gray-800';
        case 'Ongoing':
            return 'bg-blue-100 text-blue-800';
        case 'Under Review':
            return 'bg-yellow-100 text-yellow-800';
        case 'Completed':
            return 'bg-green-100 text-green-800';
        case 'Overdue':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, projectId, userId, isDragging = false, onTaskDeleted, onTaskUpdated }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAddSubtaskDialog, setShowAddSubtaskDialog] = useState(false);
    const [showRecurDialog, setShowRecurDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Check if current user is a collaborator or owner
    const isUserCollaborator = task.collaborators?.includes(userId) || false;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging: isCurrentlyDragging,
    } = useDraggable({
        id: task.id,
        data: {
            type: 'task',
            task,
        },
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    };

    // If this is the drag overlay, don't apply dragging styles
    const shouldShowDragging = isCurrentlyDragging && !isDragging;

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on the drag handle, menu, or if any dialog is open
        if ((e.target as HTMLElement).closest('.drag-handle') || 
            (e.target as HTMLElement).closest('.task-menu') ||
            showEditDialog ||
            showAddSubtaskDialog ||
            showRecurDialog) {
            return;
        }
        setShowDetails(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target) {
            const tagName = target.tagName.toLowerCase();
            const isEditable =
                target.isContentEditable ||
                tagName === 'input' ||
                tagName === 'textarea' ||
                tagName === 'select';
            if (isEditable) {
                return;
            }
        }

        // Don't trigger if any dialog is open
        if (showEditDialog || showAddSubtaskDialog || showRecurDialog) {
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails(true);
        }
    };

    const handleDelete = async () => {
        try {
            if (task.owner !== userId) {
                alert("You are not authorized to delete this task.");
                setShowDeleteDialog(false);
                return;
            }

            setIsDeleting(true);
            await TaskApi.deleteTask(task.id);
            setShowDeleteDialog(false);
            onTaskDeleted?.(task.id);
        } catch (error) {
            console.error('Failed to delete task:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card 
            ref={setNodeRef}
            style={style}
            className={`transition-all duration-200 cursor-pointer ${
                shouldShowDragging 
                    ? 'opacity-50 scale-95 rotate-3 shadow-lg' 
                    : 'hover:shadow-md active:cursor-grabbing'
            } ${isDragging ? 'shadow-xl border-blue-400' : ''}`}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            {...attributes}
        >
            <CardContent className="p-4">
                <div className="space-y-2">
                    {/* Drag handle, title, and menu */}
                    <div className="flex items-start gap-2">
                        <div 
                            {...listeners}
                            className="drag-handle mt-1 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
                        >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2">{task.title}</h4>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <TaskReminder taskId={task.id} status={task.status} deadline={task.deadline}/>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="task-menu h-8 w-8 p-0 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                    disabled={!isUserCollaborator && task.owner !== userId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isUserCollaborator || task.owner === userId) {
                                            setShowEditDialog(true);
                                        }
                                    }}
                                    className={!isUserCollaborator && task.owner !== userId ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    disabled={task.owner !== userId} // Only enabled for owner
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (task.owner === userId) { // Only allow owner to access
                                            setShowRecurDialog(true);
                                        }
                                    }}
                                    className={task.owner !== userId ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    <Gauge className="h-4 w-4 mr-2" />
                                    Recur Task
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    disabled={!isUserCollaborator && task.owner !== userId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isUserCollaborator || task.owner === userId) {
                                            setShowAddSubtaskDialog(true);
                                        }
                                    }}
                                    className={!isUserCollaborator && task.owner !== userId ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Subtask
                                </DropdownMenuItem>                                    
                                <DropdownMenuItem 
                                    disabled={task.owner !== userId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (task.owner === userId) {
                                            setShowDeleteDialog(true);
                                        }
                                    }}
                                    className={task.owner !== userId ? "opacity-50 cursor-not-allowed" : "text-red-600 focus:text-red-600"}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    <div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description || 'No description'}
                        </p>
                    </div>
                    
                    {/* Task metadata */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(task.status)}`}
                            >
                                {task.status}
                            </Badge>
                        </div>
                        
                        {/* Priority badge */}
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "text-xs font-medium",
                                (task.priority ?? 0) >= 8 ? "border-red-500 text-red-700 bg-red-50" :
                                (task.priority ?? 0) >= 4 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                "border-green-500 text-green-700 bg-green-50"
                            )}
                        >
                            <Gauge className="h-3 w-3 mr-1" />
                            {task.priority ?? "N/A"}
                        </Badge>
                    </div>
                    
                    {/* Due date */}
                    {task.deadline && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {new Date(task.deadline).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </CardContent>
            
            {/* Task Detail Modal */}
            <TaskDetailNavigator
                initialTask={task}
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
            />

            {/* Edit Task Dialog */}
            {showEditDialog && (
                <div onClick={(e) => e.stopPropagation()}>
                    <EditTask
                        taskId={task.id}
                        currentUserId={userId}
                        projectId={task.project_id ?? projectId}
                        parentTaskCollaborators={task.collaborators || []}
                        parentTaskOwnerId={task.owner}
                        onClose={() => setShowEditDialog(false)}
                        onTaskUpdated={() => {
                            setShowEditDialog(false);
                            onTaskUpdated?.();
                        }}
                    />
                </div>
            )}

            {showRecurDialog && (
                <RecurTask
                    taskId={task.id}
                    onClose={() => {
                        setShowRecurDialog(false);
                        onTaskUpdated?.();
                    }}
                />
            )}

            {/* Add Subtask Dialog */}
            {showAddSubtaskDialog && (
                <CreateSubtask
                    parentTaskId={task.id}
                    projectId={projectId}
                    currentUserId={userId}
                    parentTaskDeadline={task.deadline || new Date().toISOString()}
                    parentTaskOwnerId={task.owner}
                    parentTaskCollaborators={task.collaborators || []}
                    open={showAddSubtaskDialog}
                    onOpenChange={setShowAddSubtaskDialog}
                    onSubtaskCreated={(_newSubtask) => {
                        setShowAddSubtaskDialog(false);
                        onTaskUpdated?.();
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default TaskCard;
