import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type TaskDTO, TaskApi as TaskService, Report } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, List, GitBranch, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Notification as NotificationAPI } from "@/lib/api";

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

interface KanbanBoardProps {
      projectId: string;
      projectCreatedDate?: string; // ISO date string for default report start date
      onTaskUpdate?: (updatedTask: TaskDTO) => void;
      refreshTrigger?: number;
      tasks?: TaskDTO[]; // if you still want to allow injection
    }

type TaskFilter = 'all' | 'owner' | 'collaborator' | 'involved';
type ViewType = 'flat' | 'hierarchical';

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    projectId,
    projectCreatedDate,
    onTaskUpdate,
    refreshTrigger 
}) => {
    const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);
    const { user, profile } = useAuth();
    const [initialTasks, setInitialTasks] = useState<TaskDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
    const [viewType, setViewType] = useState<ViewType>('flat');
    const [selectedSubtask, setSelectedSubtask] = useState<TaskDTO | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportBanner, setReportBanner] = useState<{ type: 'success' | 'error' | 'info'; msg: string; href?: string } | null>(null);

    // Stabilize callback functions to prevent infinite re-subscriptions
    const handleRealtimeTaskUpdate = useCallback((updatedTask: TaskDTO) => {
        onTaskUpdate?.(updatedTask);
    }, [onTaskUpdate]);

    const handleRealtimeTaskInsert = useCallback((newTask: TaskDTO) => {
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
                .catch(() => {
                    // Failed to fetch enriched task data, but basic task is already added
                });
        }
    }, [projectId]);

    const handleRealtimeTaskDelete = useCallback((taskId: string) => {
        // Remove the task from initial tasks
        setInitialTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }, []);

    // Fetch all tasks and filter by project_id for initial load
    const fetchAllTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const allTasksData = await TaskService.getAllTask();
            
            // Filter tasks for the specific project
            const projectTasks = allTasksData.filter(task => {
                // Check if task has project_id that matches current project
                const hasProjectId = task.project_id === projectId;
                return hasProjectId;
            });
            
            setInitialTasks(projectTasks);
        } catch (err) {
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

    const handleGenerateReport = useCallback(() => {
        // Set default dates: project creation date (or 30 days ago if not provided) to today
        const today = new Date().toISOString().split('T')[0];
        const defaultStartDate = projectCreatedDate 
            ? new Date(projectCreatedDate).toISOString().split('T')[0]
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        setReportStartDate(defaultStartDate);
        setReportEndDate(today);
        setShowReportDialog(true);
    }, [projectCreatedDate]);

    const handleConfirmGenerateReport = useCallback(async () => {
        try {
            setGeneratingReport(true);
            setShowReportDialog(false);
            setReportBanner(null);
            
            if (!user?.id) {
                setReportBanner({
                    type: 'error',
                    msg: 'User not authenticated'
                });
                setGeneratingReport(false);
                return;
            }
            
            // Call the report generation API with date range and userId
            const response = await Report.generateProject(projectId, {
                startDate: reportStartDate,
                endDate: reportEndDate,
                userId: user.id
            });
            
            // Handle the response based on backend structure
            if (response.success && response.data?.reportUrl) {
                setReportBanner({
                    type: 'success',
                    msg: response.data.reportTitle || 'Project report generated successfully',
                    href: response.data.reportUrl
                });
            } else if (response.url) {
                setReportBanner({
                    type: 'success',
                    msg: 'Project report generated successfully',
                    href: response.url
                });
            } else {
                setReportBanner({
                    type: 'info',
                    msg: response.message || 'Report generation initiated'
                });
            }
            
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to generate report';
            setReportBanner({
                type: 'error',
                msg: errorMessage
            });
        } finally {
            setGeneratingReport(false);
        }
    }, [projectId, reportStartDate, reportEndDate, user]);

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
            return;
        }

        const task = realtimeTasks.find((t: TaskDTO) => t.id === taskId);
        if (!task || task.status === newStatus) {
            return;
        }

        try {
            // Mark task as updating
            setUpdatingTaskIds(prev => new Set(prev).add(taskId));
            
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
                // Failed to fetch updated task with owner info
            }
            
            // Call the callback for any additional handling
            if (onTaskUpdate) {
                onTaskUpdate({ ...task, status: newStatus });
            }

            let  collaboratorsToNotify = [...taskUpdateData.collaborators].filter(id => id !== null && id !== profile?.id);  
            if(taskUpdateData.owner !== profile?.id) collaboratorsToNotify.push(taskUpdateData.owner);
            console.log(collaboratorsToNotify, taskUpdateData.collaborators)
            if (taskUpdateData.collaborators.length > 0) {
                await NotificationAPI.publishUpdate({
                updateType: "Edited",
                resourceType: "project",
                resourceId:taskId,
                resourceContent: { 
                    updated: {...taskUpdateData},
                    original: {...taskUpdateData}
                },
                collaboratorIds: collaboratorsToNotify,
                updatedBy: profile?.display_name || "Unknown User",
                });
            }
        } catch (error) {
            // Log additional debug information
            if (error instanceof Error) {
                // Error occurred during task update
            }
            
            // If it's an Axios error, log the response details
            if (error && typeof error === 'object' && 'response' in error) {
                // HTTP error occurred
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
                        <div className="flex gap-1 border rounded-lg">
                            <Button
                                variant="ghost"
                                onClick={() => setViewType('flat')}
                                className={viewType === 'flat' ? 'bg-slate-100' : 'bg-transparent'}
                                title="Flat view - Show parent tasks only"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
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

                        <Button 
                            variant="outline" 
                            className="gap-2"
                            onClick={handleGenerateReport}
                            disabled={generatingReport}
                            aria-busy={generatingReport}
                        >
                            {generatingReport ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            {generatingReport ? 'Generating...' : 'Generate Report'}
                        </Button>

                        <Badge variant="outline">
                            {filteredTasks.length} of {realtimeTasks.length} tasks
                        </Badge>
                    </div>
                </div>

                {/* Report Generation Banner */}
                {reportBanner && (
                    <div
                        className={cn(
                            "rounded-md border p-3 text-sm",
                            reportBanner.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20"
                                : reportBanner.type === "error"
                                ? "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20"
                                : "border-border bg-muted/30 text-foreground"
                        )}
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span>{reportBanner.msg}</span>
                            {reportBanner.href && (
                                <a
                                    href={reportBanner.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 font-medium hover:text-emerald-700"
                                >
                                    Open report
                                </a>
                            )}
                        </div>
                    </div>
                )}

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
                                        currentUserId={user?.id}
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

                {/* Generate Report Dialog */}
                <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Project Report</DialogTitle>
                            <DialogDescription>
                                Select the date range for the report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={reportStartDate}
                                    onChange={(e) => setReportStartDate(e.target.value)}
                                    max={reportEndDate}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={reportEndDate}
                                    onChange={(e) => setReportEndDate(e.target.value)}
                                    min={reportStartDate}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmGenerateReport} disabled={!reportStartDate || !reportEndDate}>
                                Generate Report
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DndContext>
    );
};

export default KanbanBoard;