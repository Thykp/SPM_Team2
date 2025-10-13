import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, GripVertical } from 'lucide-react';
import { type Task } from '@/lib/api';
import { useDraggable } from '@dnd-kit/core';
import { TaskDetailNavigator } from '@/components/task/TaskDetailNavigator';

interface TaskCardProps {
    task: Task;
    isDragging?: boolean;
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

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging = false }) => {
    const [showDetails, setShowDetails] = useState(false);
    
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
        // Don't trigger if clicking on the drag handle
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            return;
        }
        setShowDetails(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails(true);
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
                    {/* Drag handle and title */}
                    <div className="flex items-start gap-2">
                        <div 
                            {...listeners}
                            className="drag-handle mt-1 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
                        >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium line-clamp-2">{task.title}</h4>
                        </div>
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
                        
                        {/* Priority number */}
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-medium">
                            {task.priority || 5}
                        </div>
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
        </Card>
    );
};

export default TaskCard;