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
import { type TaskDTO, TaskApi } from '@/lib/api';
import { Calendar, MoreVertical, Edit, Trash2, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskReminder } from '../task/TaskReminder';
import EditTask from '@/components/task/EditTask';

interface SubtaskCardProps {
    subtask: TaskDTO;
    projectId: string;
    currentUserId?: string;
    onClick?: () => void;
    onSubtaskDeleted?: (subtaskId: string) => void;
    onSubtaskUpdated?: () => void;
}

const SubtaskCard: React.FC<SubtaskCardProps> = ({ subtask, projectId, currentUserId, onClick, onSubtaskDeleted, onSubtaskUpdated }) => {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getStatusColor = (status: TaskDTO['status']) => {
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

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await TaskApi.deleteTask(subtask.id);
            setShowDeleteDialog(false);
            onSubtaskDeleted?.(subtask.id);
        } catch (error) {
            console.error('Failed to delete subtask:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on the menu or if any dialog is open
        if ((e.target as HTMLElement).closest('.subtask-menu') ||
            showEditDialog ||
            showDeleteDialog) {
            return;
        }
        onClick?.();
    };

    return (
        <>
            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-300"
                onClick={handleCardClick}
            >
                <CardContent className="p-4">
                    <div className="space-y-2">
                        {/* Title and menu */}
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium line-clamp-2">{subtask.title}</h4>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="subtask-menu h-8 w-8 p-0 flex-shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowEditDialog(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Subtask
                                    </DropdownMenuItem>
                                    {currentUserId && subtask.owner && currentUserId === subtask.owner && (
                                        <DropdownMenuItem 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDeleteDialog(true);
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Subtask
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        {/* Description */}
                        <div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {subtask.description || 'No description'}
                            </p>
                        </div>
                        
                        {/* Task metadata */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getStatusColor(subtask.status)}`}
                                >
                                    {subtask.status}
                                </Badge>
                            <div onClick={(e) => e.stopPropagation()}>
                                <TaskReminder taskId={subtask.id} status={subtask.status} deadline={subtask.deadline}/>
                            </div>
                            </div>
                            {/* Priority badge */}
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-xs font-medium",
                                    (subtask.priority ?? 0) >= 8 ? "border-red-500 text-red-700 bg-red-50" :
                                    (subtask.priority ?? 0) >= 4 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                    "border-green-500 text-green-700 bg-green-50"
                                )}
                            >
                                <Gauge className="h-3 w-3 mr-1" />
                                {subtask.priority ?? "N/A"}
                            </Badge>
                        </div>
                        
                        {/* Due date */}
                        {subtask.deadline && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due {new Date(subtask.deadline).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        
        {/* Edit Subtask Dialog */}
        {showEditDialog && (
            <div onClick={(e) => e.stopPropagation()}>
                <EditTask
                    taskId={subtask.id}
                    currentUserId={currentUserId || ''}
                    projectId={subtask.project_id || projectId}
                    parentTaskCollaborators={subtask.collaborators || []}
                    parentTaskOwnerId={subtask.owner}
                    onClose={() => setShowEditDialog(false)}
                    onTaskUpdated={() => {
                        setShowEditDialog(false);
                        onSubtaskUpdated?.();
                    }}
                />
            </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Delete Subtask</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{subtask.title}"? This action cannot be undone.
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
        </>
    );
};

export default SubtaskCard;
