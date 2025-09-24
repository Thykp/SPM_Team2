import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { type Task } from '@/lib/api';

interface TaskCardProps {
    task: Task;
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

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="space-y-2">
                    <h4 className="font-medium line-clamp-2">{task.title}</h4>
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