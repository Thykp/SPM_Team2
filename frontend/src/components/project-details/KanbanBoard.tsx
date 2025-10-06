import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { type Task, Task as TaskService } from '@/lib/api';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import KanbanColumn from './KanbanColumn';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import TaskCard from './TaskCard';

interface KanbanColumn {
    id: string;
    title: string;
    tasks: Task[];
}

interface KanbanBoardProps {
    tasks: Task[];
    projectId: string; // Add projectId prop for realtime filtering
    onTaskUpdate?: (updatedTask: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    tasks: initialTasks, 
    projectId,
    onTaskUpdate 
}) => {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // Stabilize callback functions to prevent infinite re-subscriptions
    const handleRealtimeTaskUpdate = useCallback((updatedTask: Task) => {
        onTaskUpdate?.(updatedTask);
    }, [onTaskUpdate]);

    const handleRealtimeTaskInsert = useCallback(() => {
        // Handle new task insertion if needed
    }, []);

    const handleRealtimeTaskDelete = useCallback(() => {
        // Handle task deletion if needed
    }, []);

    // Use realtime hook for live updates
    const { tasks } = useRealtimeTasks({
        projectId,
        initialTasks,
        onTaskUpdate: handleRealtimeTaskUpdate,
        onTaskInsert: handleRealtimeTaskInsert,
        onTaskDelete: handleRealtimeTaskDelete,
    });

    // Map column IDs to status values
    const columnStatusMap: Record<string, Task['status']> = {
        'unassigned': 'Unassigned',
        'ongoing': 'Ongoing',
        'under-review': 'Under Review',
        'completed': 'Completed',
        'overdue': 'Overdue',
    };

    // Kanban columns configuration
    const columns: KanbanColumn[] = [
        { id: 'unassigned', title: 'Unassigned', tasks: tasks.filter(task => task.status === 'Unassigned') },
        { id: 'ongoing', title: 'Ongoing', tasks: tasks.filter(task => task.status === 'Ongoing') },
        { id: 'under-review', title: 'Under Review', tasks: tasks.filter(task => task.status === 'Under Review') },
        { id: 'completed', title: 'Completed', tasks: tasks.filter(task => task.status === 'Completed') },
        { id: 'overdue', title: 'Overdue', tasks: tasks.filter(task => task.status === 'Overdue') },
    ];

    // Configure sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // 3px movement required to start drag
            },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find(t => t.id === active.id);
        setActiveTask(task || null);
    }, [tasks]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over || active.id === over.id) {
            return;
        }

        const taskId = active.id as string;
        const newColumnId = over.id as string;
        const newStatus = columnStatusMap[newColumnId];

        if (!newStatus) {
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) {
            return;
        }

        try {
            // Update task status via API
            // The realtime subscription will automatically update the UI
            await TaskService.updateTask(taskId, {
                ...task,
                status: newStatus,
            });
            
            // Note: We don't need to manually update state here because
            // the realtime subscription will handle the UI update
        } catch (error) {
            console.error('Failed to update task status:', error);
            // You might want to show a toast notification here
            // Optionally, you could revert the optimistic update here
        }
    }, [tasks, columnStatusMap, onTaskUpdate]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
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
                            id={column.id}
                            title={column.title} 
                            tasks={column.tasks} 
                        />
                    ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? (
                        <div className="rotate-3 opacity-90">
                            <TaskCard task={activeTask} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default KanbanBoard;