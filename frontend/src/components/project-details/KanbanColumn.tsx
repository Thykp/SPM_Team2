import React from 'react';
import { Badge } from '@/components/ui/badge';
import { type Task } from '@/lib/api';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
    title: string;
    tasks: Task[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, tasks }) => {
    return (
        <div className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary" className="text-xs">
                    {tasks.length}
                </Badge>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks in {title.toLowerCase()}
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;