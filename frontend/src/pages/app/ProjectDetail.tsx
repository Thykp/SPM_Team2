import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Loader from '@/components/layout/Loader';
import { ArrowLeft } from 'lucide-react';
import { Project as ProjectAPI, Task as TaskAPI, type ProjectDto, type Task } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectHeader, ProjectInfo, KanbanBoard } from '@/components/project-details';

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const [project, setProject] = useState<ProjectDto | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Handler for when a new task is created
    const handleTaskCreated = async (newTask: Task) => {
        // Add the new task to the current list immediately for optimistic UI update
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        // Optionally, refetch all tasks to ensure consistency with the server
        if (project?.tasklist) {
            try {
                const updatedTasks = await fetchTasksByIds([...project.tasklist, newTask.id]);
                setTasks(updatedTasks);
            } catch (err) {
                console.warn('Failed to refresh tasks after creation:', err);
            }
        }
    };

    // Fetch individual tasks based on task IDs
    const fetchTasksByIds = async (taskIds: string[]): Promise<Task[]> => {
        const taskPromises = taskIds.map(taskId => 
            TaskAPI.getTasksById(taskId).catch(err => {
                console.warn(`Failed to fetch task ${taskId}:`, err);
                return null; // Return null for failed requests
            })
        );
        
        const taskResults = await Promise.all(taskPromises);
        
        // Filter out null results and sort by status priority
        return taskResults
            .filter((task): task is Task => task !== null)
            .sort((a, b) => {
                // Define status priority for sorting
                const statusPriority: Record<string, number> = {
                    'Unassigned': 1,
                    'Ongoing': 2,
                    'Under Review': 3,
                    'Completed': 4,
                    'Overdue': 5
                };
                
                const priorityA = statusPriority[a.status] || 999;
                const priorityB = statusPriority[b.status] || 999;
                
                return priorityA - priorityB;
            });
    };

    useEffect(() => {
        const fetchProjectData = async () => {
            if (!projectId || !user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch project details
                const allProjects = await ProjectAPI.getByUser(user.id);
                const foundProject = allProjects.find(p => p.id === projectId);
                
                if (!foundProject) {
                    throw new Error('Project not found');
                }

                setProject(foundProject);
                
                // Fetch individual tasks based on project's tasklist
                if (foundProject.tasklist && foundProject.tasklist.length > 0) {
                    const projectTasks = await fetchTasksByIds(foundProject.tasklist);
                    setTasks(projectTasks);
                } else {
                    setTasks([]);
                }
            } catch (err) {
                console.error('Error fetching project data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch project data');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [projectId, user?.id]);

    if (loading) {
        return (
        <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true" aria-live="polite">
            <Loader />
        </div>
        );
    }

    if (error || !project) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/app/projects">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Projects
                        </Button>
                    </Link>
                </div>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-2">
                        {error ? 'Error Loading Project' : 'Project Not Found'}
                    </h1>
                    <p className="text-muted-foreground">
                        {error || 'The requested project could not be found.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ProjectHeader 
                project={project} 
                userId={user?.id} 
                onTaskCreated={handleTaskCreated} 
            />
            
            <ProjectInfo 
                project={project} 
            />
            
            <KanbanBoard tasks={tasks} />
        </div>
    );
};

export default ProjectDetail;