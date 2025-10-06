import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, GripVertical } from 'lucide-react';
import { type Task } from '@/lib/api';
import { useDraggable } from '@dnd-kit/core';

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

    return (
        <Card 
            ref={setNodeRef}
            style={style}
            className={`transition-all duration-200 ${
                shouldShowDragging 
                    ? 'opacity-50 scale-95 rotate-3 shadow-lg' 
                    : 'hover:shadow-md cursor-grab active:cursor-grabbing'
            } ${isDragging ? 'shadow-xl border-blue-400' : ''}`}
            {...attributes}
        >
            <CardContent className="p-4">
                <div className="space-y-2">
                    {/* Drag handle and title */}
                    <div className="flex items-start gap-2">
                        <div 
                            {...listeners}
                            className="mt-1 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
                        >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                        <h4 className="font-medium line-clamp-2 flex-1">{task.title}</h4>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description || 'No description'}
                    </p>
                    
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
                        
                        {/* Assignee avatar placeholder */}
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                            {task.owner ? task.owner.charAt(0).toUpperCase() : '?'}
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
        </Card>
    );
};

export default TaskCard;