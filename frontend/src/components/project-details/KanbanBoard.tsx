import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { type Task } from '@/lib/api';
import KanbanColumn from './KanbanColumn';

interface KanbanColumn {
    id: string;
    title: string;
    tasks: Task[];
}

interface KanbanBoardProps {
    tasks: Task[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
    // Kanban columns configuration
    const columns: KanbanColumn[] = [
        { id: 'unassigned', title: 'Unassigned', tasks: tasks.filter(task => task.status === 'Unassigned') },
        { id: 'ongoing', title: 'Ongoing', tasks: tasks.filter(task => task.status === 'Ongoing') },
        { id: 'under-review', title: 'Under Review', tasks: tasks.filter(task => task.status === 'Under Review') },
        { id: 'completed', title: 'Completed', tasks: tasks.filter(task => task.status === 'Completed') },
        { id: 'overdue', title: 'Overdue', tasks: tasks.filter(task => task.status === 'Overdue') },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Project Board</h2>
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{tasks.length} tasks</Badge>
                    <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-96">
                {columns.map((column) => (
                    <KanbanColumn 
                        key={column.id} 
                        title={column.title} 
                        tasks={column.tasks} 
                    />
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;