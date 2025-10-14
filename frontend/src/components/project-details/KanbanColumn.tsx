import React from 'react';
import { Badge } from '@/components/ui/badge';
import { type Task } from '@/lib/api';
import TaskCard from './TaskCard';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: Task[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    const getColumnColor = (columnId: string) => {
        switch (columnId) {
            case 'unassigned':
                return 'border-gray-200 bg-gray-50';
            case 'ongoing':
                return 'border-blue-200 bg-blue-50';
            case 'under-review':
                return 'border-yellow-200 bg-yellow-50';
            case 'completed':
                return 'border-green-200 bg-green-50';
            case 'overdue':
                return 'border-red-200 bg-red-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    return (
        <div 
            ref={setNodeRef}
            className={`space-y-4 min-h-96 p-4 rounded-lg border-2 transition-all duration-200 ${
                isOver 
                    ? 'border-blue-400 bg-blue-50 shadow-lg' 
                    : getColumnColor(id)
            }`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <Badge variant="secondary" className="text-xs">
                    {tasks.length}
                </Badge>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <div className={`text-center py-8 text-muted-foreground text-sm rounded-lg border-2 border-dashed transition-all ${
                        isOver 
                            ? 'border-blue-300 bg-blue-100/50 text-blue-600' 
                            : 'border-gray-200'
                    }`}>
                        {isOver ? 'Drop task here' : `No tasks in ${title.toLowerCase()}`}
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