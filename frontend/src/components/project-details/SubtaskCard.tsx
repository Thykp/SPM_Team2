import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Check, MoreVertical, Edit, Trash2 } from 'lucide-react';
import EditProjectTask from './EditProjectTask';
import { TaskReminder } from '../task/TaskReminder';

interface SubtaskCardProps {
    subtask: TaskDTO;
    projectId: string;
    onClick?: () => void;
    onSubtaskDeleted?: (subtaskId: string) => void;
    onSubtaskUpdated?: () => void;
}

const SubtaskCard: React.FC<SubtaskCardProps> = ({ subtask, projectId, onClick, onSubtaskDeleted, onSubtaskUpdated }) => {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusColor = (status: TaskDTO['status']) => {
        switch (status) {
            case 'Unassigned':
                return 'bg-gray-100 text-gray-700';
            case 'Ongoing':
                return 'bg-blue-100 text-blue-700';
            case 'Under Review':
                return 'bg-yellow-100 text-yellow-700';
            case 'Completed':
                return 'bg-green-100 text-green-700';
            case 'Overdue':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
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
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-slate-300"
                onClick={handleCardClick}
            >
            <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {subtask.status === 'Completed' && (
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium truncate flex-1">{subtask.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {subtask.priority && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                P{subtask.priority}
                            </Badge>
                        )}
                        <Badge className={`text-xs ${getStatusColor(subtask.status)}`}>
                            {subtask.status}
                        </Badge>
                        {subtask.ownerName ? (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                    {getInitials(subtask.ownerName)}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">?</AvatarFallback>
                            </Avatar>
                        )}
                        
                        {/* Dropdown Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="subtask-menu h-6 w-6 p-0 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEditDialog(true);
                                    }}
                                >
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit Subtask
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteDialog(true);
                                    }}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete Subtask
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        < TaskReminder taskId={subtask.id} status={subtask.status} deadline={subtask.deadline}/>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {/* Edit Subtask Dialog */}
        {showEditDialog && (
            <div onClick={(e) => e.stopPropagation()}>
                <EditProjectTask
                    taskId={subtask.id}
                    projectId={projectId}
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
