import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { type TaskDTO } from '@/lib/api';
import TaskCard from './TaskCard';
import SubtaskCard from './SubtaskCard';
import { TaskDetailNavigator } from '../task/TaskDetailNavigator';
import { useDroppable } from '@dnd-kit/core';

interface TaskWithSubtasks {
    task: TaskDTO;
    subtasks: TaskDTO[];
}

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: TaskDTO[];
    projectId: string;
    userId: string; // Add userId for subtask creation
    tasksWithSubtasks?: TaskWithSubtasks[];
    viewType?: 'flat' | 'hierarchical';
    onTaskDeleted?: (taskId: string) => void;
    onTaskUpdated?: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, projectId, userId, tasksWithSubtasks, viewType = 'flat', onTaskDeleted, onTaskUpdated }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });
    const [selectedSubtask, setSelectedSubtask] = useState<TaskDTO | null>(null);

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
                ) : viewType === 'hierarchical' && tasksWithSubtasks ? (
                    // Hierarchical view: show tasks with their subtasks
                    tasksWithSubtasks.map(({ task, subtasks }) => (
                        <div key={task.id}>
                            <TaskCard task={task} projectId={projectId} userId={userId} onTaskDeleted={onTaskDeleted} onTaskUpdated={onTaskUpdated} />
                            {subtasks.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {subtasks.map((subtask) => (
                                        <SubtaskCard 
                                            key={subtask.id} 
                                            subtask={subtask}
                                            projectId={projectId}
                                            onClick={() => setSelectedSubtask(subtask)}
                                            onSubtaskDeleted={onTaskDeleted}
                                            onSubtaskUpdated={onTaskUpdated}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    // Flat view: show only parent tasks
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} projectId={projectId} userId={userId} onTaskDeleted={onTaskDeleted} onTaskUpdated={onTaskUpdated} />
                    ))
                )}
            </div>

            {/* Subtask Detail Modal */}
            {selectedSubtask && (
                <TaskDetailNavigator
                    key={selectedSubtask.id}
                    initialTask={selectedSubtask}
                    isOpen={true}
                    onClose={() => setSelectedSubtask(null)}
                />
            )}
        </div>
    );
};

export default KanbanColumn;