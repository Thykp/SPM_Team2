import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type TaskDTO, TaskApi as TaskService } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Filter, List, GitBranch } from 'lucide-react';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useAuth } from '@/contexts/AuthContext';
import KanbanColumn from './KanbanColumn';
import ParentTaskRow from './ParentTaskRow';
import { TaskDetailNavigator } from '../task/TaskDetailNavigator';
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

interface TaskWithSubtasks {
    task: TaskDTO;
    subtasks: TaskDTO[];
}

interface KanbanColumn {
    id: string;
    title: string;
    tasks: TaskDTO[];
    tasksWithSubtasks?: TaskWithSubtasks[];
}

// interface KanbanBoardProps {
//     tasks: TaskDTO[];
//     projectId: string; // Add projectId prop for realtime filtering
//     onTaskUpdate?: (updatedTask: TaskDTO) => void;
//     refreshTrigger?: number; // Add trigger for external refresh
// }

interface KanbanBoardProps {
      projectId: string;
      onTaskUpdate?: (updatedTask: TaskDTO) => void;
      refreshTrigger?: number;
      tasks?: TaskDTO[]; // if you still want to allow injection
    }

type TaskFilter = 'all' | 'owner' | 'collaborator' | 'involved';
type ViewType = 'flat' | 'hierarchical';

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    projectId,
    onTaskUpdate,
    refreshTrigger 
}) => {
    const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);
    const { user } = useAuth();
    const [initialTasks, setInitialTasks] = useState<TaskDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
    const [viewType, setViewType] = useState<ViewType>('flat');
    const [selectedSubtask, setSelectedSubtask] = useState<TaskDTO | null>(null);

    // Stabilize callback functions to prevent infinite re-subscriptions
    const handleRealtimeTaskUpdate = useCallback((updatedTask: TaskDTO) => {
        onTaskUpdate?.(updatedTask);
    }, [onTaskUpdate]);

    const handleRealtimeTaskInsert = useCallback((newTask: TaskDTO) => {
        console.log('New task inserted via realtime:', newTask);
        
        // Check if this task belongs to the current project
        if (newTask.project_id === projectId) {
            // Add the basic task immediately for responsive UI
            setInitialTasks(prevTasks => {
                const taskExists = prevTasks.some(task => task.id === newTask.id);
                if (taskExists) return prevTasks;
                
                return [...prevTasks, newTask];
            });
            
            // Fetch enriched data in the background
            TaskService.getTaskByIdWithOwner(newTask.id)
                .then(enrichedTask => {
                    if (enrichedTask) {
                        setInitialTasks(prevTasks => {
                            const taskIndex = prevTasks.findIndex(task => task.id === newTask.id);
                            if (taskIndex === -1) return prevTasks;
                            
                            const updatedTasks = [...prevTasks];
                            updatedTasks[taskIndex] = enrichedTask;
                            return updatedTasks;
                        });
                    }
                })
                .catch(error => {
                    console.warn('Failed to fetch enriched task data:', error);
                });
        }
    }, [projectId]);

    const handleRealtimeTaskDelete = useCallback((taskId: string) => {
        console.log('Task deleted via realtime:', taskId);
        // Remove the task from initial tasks
        setInitialTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }, []);

    // Fetch all tasks and filter by project_id for initial load
    const fetchAllTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching all tasks for project:', projectId);
            const allTasksData = await TaskService.getAllTask();
            console.log('All tasks received:', allTasksData);
            
            // Filter tasks for the specific project
            const projectTasks = allTasksData.filter(task => {
                // Check if task has project_id that matches current project
                const hasProjectId = task.project_id === projectId;
                if (hasProjectId) {
                    console.log('Task belongs to project:', task.title, task.project_id);
                }
                return hasProjectId;
            });
            
            console.log('Filtered tasks for project:', projectTasks);
            setInitialTasks(projectTasks);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError('Failed to load tasks');
            setInitialTasks([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            fetchAllTasks();
        }
    }, [projectId, refreshTrigger, fetchAllTasks]); // Include refreshTrigger in dependencies

    // Use realtime hook for live updates after initial fetch
    const { tasks: realtimeTasks } = useRealtimeTasks({
        projectId,
        initialTasks,
        onTaskUpdate: handleRealtimeTaskUpdate,
        onTaskInsert: handleRealtimeTaskInsert,
        onTaskDelete: handleRealtimeTaskDelete,
    });

    // Filter tasks based on user's role in the task
    // Also exclude subtasks (tasks with a parent) from the board
    const filteredTasks = useMemo(() => {
        // First, filter out subtasks (tasks with a parent)
        const mainTasks = realtimeTasks.filter((task: TaskDTO) => !task.parent);

        // If no user filter is applied, return all main tasks
        if (!user?.id || taskFilter === 'all') {
            return mainTasks;
        }

        // Apply user-based filters
        return mainTasks.filter((task: TaskDTO) => {
            const isOwner = task.owner === user.id;
            const isCollaborator = task.collaborators.includes(user.id);

            switch (taskFilter) {
                case 'owner':
                    return isOwner;
                case 'collaborator':
                    return isCollaborator;
                case 'involved':
                    return isOwner || isCollaborator;
                default:
                    return true;
            }
        });
    }, [realtimeTasks, taskFilter, user?.id]);

    // Build hierarchical structure: parent tasks with their subtasks
    // Sort by priority (highest priority = highest number = appears first)
    const tasksWithSubtasks = useMemo(() => {
        // Helper function to sort tasks by priority (descending)
        const sortByPriority = (tasks: TaskDTO[]) => {
            return [...tasks].sort((a, b) => {
                const priorityA = a.priority || 0;
                const priorityB = b.priority || 0;
                return priorityB - priorityA; // Higher priority first
            });
        };

        if (viewType === 'flat') {
            const sorted = sortByPriority(filteredTasks);
            return sorted.map(task => ({ task, subtasks: [] }));
        }

        // Get all subtasks from realtimeTasks (including those with parents)
        const subtasksMap = new Map<string, TaskDTO[]>();
        
        realtimeTasks.forEach((task: TaskDTO) => {
            if (task.parent) {
                const parentId = task.parent;
                if (!subtasksMap.has(parentId)) {
                    subtasksMap.set(parentId, []);
                }
                subtasksMap.get(parentId)!.push(task);
            }
        });

        // Sort parent tasks by priority
        const sortedParents = sortByPriority(filteredTasks);

        // Map parent tasks to include their subtasks (also sorted by priority)
        return sortedParents.map(task => ({
            task,
            subtasks: sortByPriority(subtasksMap.get(task.id) || [])
        }));
    }, [filteredTasks, realtimeTasks, viewType]);

    // Map column IDs to status values
    const columnStatusMap: Record<string, TaskDTO['status']> = {
        'unassigned': 'Unassigned',
        'ongoing': 'Ongoing',
        'under-review': 'Under Review',
        'completed': 'Completed',
        'overdue': 'Overdue',
    };

    // Status configuration for ParentTaskRow
    const statuses = [
        { id: 'unassigned', title: 'Unassigned' },
        { id: 'ongoing', title: 'Ongoing' },
        { id: 'under-review', title: 'Under Review' },
        { id: 'completed', title: 'Completed' },
        { id: 'overdue', title: 'Overdue' },
    ];

    // Kanban columns configuration
    // Extract sorted tasks from tasksWithSubtasks for consistency
    const sortedTasks = tasksWithSubtasks.map(({ task }) => task);
    
    const columns: KanbanColumn[] = [
        { 
            id: 'unassigned', 
            title: 'Unassigned', 
            tasks: sortedTasks.filter((task: TaskDTO) => task.status === 'Unassigned'),
            tasksWithSubtasks: tasksWithSubtasks.filter(({ task }) => task.status === 'Unassigned')
        },
        { 
            id: 'ongoing', 
            title: 'Ongoing', 
            tasks: sortedTasks.filter((task: TaskDTO) => task.status === 'Ongoing'),
            tasksWithSubtasks: tasksWithSubtasks.filter(({ task }) => task.status === 'Ongoing')
        },
        { 
            id: 'under-review', 
            title: 'Under Review', 
            tasks: sortedTasks.filter((task: TaskDTO) => task.status === 'Under Review'),
            tasksWithSubtasks: tasksWithSubtasks.filter(({ task }) => task.status === 'Under Review')
        },
        { 
            id: 'completed', 
            title: 'Completed', 
            tasks: sortedTasks.filter((task: TaskDTO) => task.status === 'Completed'),
            tasksWithSubtasks: tasksWithSubtasks.filter(({ task }) => task.status === 'Completed')
        },
        { 
            id: 'overdue', 
            title: 'Overdue', 
            tasks: sortedTasks.filter((task: TaskDTO) => task.status === 'Overdue'),
            tasksWithSubtasks: tasksWithSubtasks.filter(({ task }) => task.status === 'Overdue')
        },
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
        const task = realtimeTasks.find((t: TaskDTO) => t.id === active.id);
        setActiveTask(task || null);
    }, [realtimeTasks]);

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

        // Prevent multiple simultaneous updates of the same task
        if (updatingTaskIds.has(taskId)) {
            console.warn('Task update already in progress:', taskId);
            return;
        }

        const task = realtimeTasks.find((t: TaskDTO) => t.id === taskId);
        if (!task || task.status === newStatus) {
            return;
        }

        try {
            // Mark task as updating
            setUpdatingTaskIds(prev => new Set(prev).add(taskId));
            
            // Log the task data before transformation for debugging
            console.log('Task before transformation:', task);

            // Ensure all required fields are present and valid
            // If no owner is present, assign the current user as owner
            const owner = task.owner || user?.id || null;
            const collaborators = task.collaborators || [];

            const taskUpdateData = {
                title: task.title || 'Untitled Task',
                description: task.description || '',
                status: newStatus,
                owner: owner,
                collaborators: collaborators, // Keep original collaborators, don't auto-add owner
                deadline: task.deadline || new Date().toISOString(),
                project_id: task.project_id || null,
                parent: task.parent || null,
                priority: Number(task.priority) || 5, // Ensure priority is a number
            };

            // Validate required fields
            if (!taskUpdateData.title.trim()) {
                throw new Error('Task title is required');
            }
            
            // Validate that task has an owner (satisfies "at least one participant" requirement)
            if (!taskUpdateData.owner) {
                throw new Error('Task must have an owner');
            }

            console.log('Updating task with data:', taskUpdateData);
            
            // Update task status via API
            // The realtime subscription will automatically update the UI instantly
            await TaskService.updateTask(taskId, taskUpdateData);
            
            // Fetch the updated task with complete owner information
            try {
                const updatedTaskWithOwnerInfo = await TaskService.getTaskByIdWithOwner(taskId);
                if (updatedTaskWithOwnerInfo) {
                    // Update the initial tasks state with the enriched data
                    setInitialTasks(prevTasks => {
                        const taskIndex = prevTasks.findIndex(t => t.id === taskId);
                        if (taskIndex === -1) return prevTasks;
                        
                        const newTasks = [...prevTasks];
                        newTasks[taskIndex] = { ...updatedTaskWithOwnerInfo, status: newStatus };
                        return newTasks;
                    });
                }
            } catch (ownerFetchError) {
                console.warn('Failed to fetch updated task with owner info:', ownerFetchError);
            }
            
            // Call the callback for any additional handling
            if (onTaskUpdate) {
                onTaskUpdate({ ...task, status: newStatus });
            }
        } catch (error) {
            console.error('Failed to update task status:', error);
            
            // Log additional debug information
            if (error instanceof Error) {
                console.error('Error message:', error.message);
            }
            
            // If it's an Axios error, log the response details
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                console.error('HTTP Status:', axiosError.response?.status);
                console.error('Response Data:', axiosError.response?.data);
                console.error('Request URL:', axiosError.config?.url);
                console.error('Request Data:', axiosError.config?.data);
            }
            
            // The realtime hook will handle any inconsistencies
            // Optionally show a toast notification here
        } finally {
            // Clear updating state
            setUpdatingTaskIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
            });
        }
    }, [realtimeTasks, columnStatusMap, onTaskUpdate, updatingTaskIds]);

    // Show loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Project Board</h2>
                    <Badge variant="outline">Loading...</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-96">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={`loading-${i}`} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                            <div className="h-6 bg-gray-300 rounded mb-2"></div>
                            <div className="h-4 bg-gray-300 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Project Board</h2>
                    <Badge variant="destructive">Error</Badge>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchAllTasks} variant="outline">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

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
                        {/* View Type Toggle */}
                        <div className="flex gap-1 border rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewType('flat')}
                                className={viewType === 'flat' ? 'bg-slate-100' : 'bg-transparent'}
                                title="Flat view - Show parent tasks only"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewType('hierarchical')}
                                className={viewType === 'hierarchical' ? 'bg-slate-100' : 'bg-transparent'}
                                title="Hierarchical view - Show tasks with subtasks"
                            >
                                <GitBranch className="h-4 w-4" />
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 bg-transparent">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel>Show Tasks</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                    value={taskFilter}
                                    onValueChange={(v) => setTaskFilter(v as TaskFilter)}
                                >
                                    <DropdownMenuRadioItem value="all">All Tasks</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="owner">Tasks I Own</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="collaborator">Tasks I Collaborate On</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="involved">Tasks I'm Involved In</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        <Badge variant="outline">
                            {filteredTasks.length} of {realtimeTasks.length} tasks
                        </Badge>
                    </div>
                </div>

                {viewType === 'flat' ? (
                    /* Flat View: Traditional Kanban columns */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-96">
                        {columns.map((column) => (
                            <KanbanColumn 
                                key={column.id} 
                                id={column.id}
                                title={column.title} 
                                tasks={column.tasks}
                                projectId={projectId}
                                userId={user?.id || ''}
                                onTaskDeleted={handleRealtimeTaskDelete}
                                onTaskUpdated={fetchAllTasks}
                            />
                        ))}
                    </div>
                ) : (
                    /* Hierarchical View: Jira-style with parent task headers */
                    <div>
                        {/* Parent Task Rows with Subtasks */}
                        <div className="space-y-2">
                            {tasksWithSubtasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No tasks to display
                                </div>
                            ) : (
                                tasksWithSubtasks.map(({ task, subtasks }) => (
                                    <ParentTaskRow
                                        key={task.id}
                                        parentTask={task}
                                        subtasks={subtasks}
                                        statuses={statuses}
                                        projectId={projectId}
                                        onSubtaskClick={setSelectedSubtask}
                                        onSubtaskDeleted={handleRealtimeTaskDelete}
                                        onSubtaskUpdated={fetchAllTasks}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? (
                        <div className="rotate-3 opacity-90">
                            <TaskCard task={activeTask} projectId={projectId} userId={user?.id || ''} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>

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
        </DndContext>
    );
};

export default KanbanBoard;