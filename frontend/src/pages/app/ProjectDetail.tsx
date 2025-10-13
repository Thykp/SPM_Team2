import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Loader from '@/components/layout/Loader';
import { ArrowLeft } from 'lucide-react';
import { Project as ProjectAPI, Profile, type ProjectDto, type Task } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectHeader, ProjectInfo, KanbanBoard } from '@/components/project-details';

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const [project, setProject] = useState<ProjectDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ownerName, setOwnerName] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger

    // Handler for when a new task is created
    const handleTaskCreated = async (newTask: Task) => {
        // Task creation is now handled by the KanbanBoard component
        // This handler triggers a refresh of the KanbanBoard
        console.log('New task created:', newTask);
        setRefreshTrigger(prev => prev + 1); // Trigger KanbanBoard refresh
    };

    // Handler for when a task is updated (e.g., status change from drag & drop)
    const handleTaskUpdate = (updatedTask: Task) => {
        // Task updates are now handled by the KanbanBoard component
        // This handler can be used for additional side effects if needed
        console.log('Task updated:', updatedTask);
    };

    // Handler for when the project is updated (e.g., from edit dialog)
    const handleProjectUpdate = (updatedProject: ProjectDto) => {
        setProject(updatedProject);
        // Update owner name if needed
        if (updatedProject.title !== project?.title) {
            // Refetch owner information if the project was updated
            Profile.getAllUsers()
                .then((allUsers) => {
                    const ownerUser = allUsers.find(u => u.id === updatedProject.owner);
                    if (ownerUser) {
                        setOwnerName(ownerUser.display_name || `${ownerUser.role} (${updatedProject.owner.slice(0, 8)}...)`);
                    }
                })
                .catch(() => {
                    // Silent error handling
                });
        }
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

                // Fetch project details directly by ID
                let foundProject;
                try {
                    foundProject = await ProjectAPI.getById(projectId);
                } catch {
                    // Fallback to searching in user projects
                    const allProjects = await ProjectAPI.getByUser(user.id);
                    foundProject = allProjects.find(p => p.id === projectId);
                }
                
                if (!foundProject) {
                    throw new Error('Project not found');
                }

                setProject(foundProject);
                
                // Fetch owner information
                try {
                    const response = await Profile.getAllUsers();
                    const allUsers = Array.isArray(response) ? response : (response as any).data || [];

                    const ownerUser = allUsers.find((u: { id: string; display_name: string; role: string }) => u.id === foundProject.owner);
                    console.log('🔍 Found owner user:', ownerUser);

                    if (ownerUser) {
                        console.log('🔍 Owner display_name:', ownerUser.display_name);
                        console.log('🔍 Owner role:', ownerUser.role);

                        setOwnerName(ownerUser.display_name || `${ownerUser.role} (${foundProject.owner.slice(0, 8)}...)`);
                    } else {
                        console.warn('⚠️ Owner user NOT FOUND in users list');

                        setOwnerName(`User ${foundProject.owner.slice(0, 8)}...`);
                    }
                } catch {
                    setOwnerName(`User ${foundProject.owner.slice(0, 8)}...`);
                }
                
                setError(null);
            } catch (err) {
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
                onProjectUpdate={handleProjectUpdate}
            />
            
            <ProjectInfo 
                project={project} 
                ownerName={ownerName}
            />
            
            <KanbanBoard 
                projectId={projectId!} // Pass projectId for filtering tasks
                onTaskUpdate={handleTaskUpdate}
                refreshTrigger={refreshTrigger} // Pass refresh trigger
            />
        </div>
    );
};

export default ProjectDetail;