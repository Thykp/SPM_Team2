import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CollaboratorPicker } from '@/components/CollaboratorPicker';
import { Project, type ProjectDto, type TaskDTO, type UpdateProjectRequest } from '@/lib/api';
import CreateProjectTask from './CreateProjectTask';
import { useAuth } from '@/contexts/AuthContext';
import { Notification as NotificationAPI } from '@/lib/api';

interface ProjectHeaderProps {
    project: ProjectDto;
    userId?: string;
    onTaskCreated: (task: TaskDTO) => void;
    onProjectUpdate?: (updatedProject: ProjectDto) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
    project, 
    userId, 
    onTaskCreated,
    onProjectUpdate
}) => {
    const { profile } = useAuth();
    const [oldCollaborators, setOldCollaborators] = useState<string[]>(project.collaborators || []);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        title: project.title,
        description: project.description,
        collaborators: project.collaborators || [],
    });
    
    // State for collaborator picker
    // const [users, setUsers] = useState<LiteUser[]>([]);
    // const [userSearchTerm, setUserSearchTerm] = useState('');
    // const [loadingUsers, setLoadingUsers] = useState(false);

    // // Load users when edit dialog opens
    // useEffect(() => {
    //     if (isEditDialogOpen && users.length === 0) {
    //         setLoadingUsers(true);
    //         Profile.getAllUsers()
    //             .then((data) => {
    //                 setUsers(data);
    //             })
    //             .catch(() => {
    //                 // Silent error handling
    //             })
    //             .finally(() => {
    //                 setLoadingUsers(false);
    //             });
    //     }
    // }, [isEditDialogOpen, users.length]);

    // // Helper function to toggle collaborator selection
    // const handleToggleCollaborator = (userId: string) => {
    //     setEditForm(prev => ({
    //         ...prev,
    //         collaborators: prev.collaborators.includes(userId)
    //             ? prev.collaborators.filter(id => id !== userId)
    //             : [...prev.collaborators, userId]
    //     }));
    // };

    const handleEditProject = async () => {
        try {
            setIsLoadingEdit(true);
            // Fetch current project data to get proper collaborator UUIDs
            const currentProject = await Project.getById(project.id);

            setEditForm({
                title: project.title,
                description: project.description,
                collaborators: currentProject.collaborators || [],
            });
            // setUserSearchTerm(''); // Reset search term
            setIsEditDialogOpen(true);
        } catch {
            // Fallback to local data
            setEditForm({
                title: project.title,
                description: project.description,
                collaborators: project.collaborators || [],
            });
            setOldCollaborators(project.collaborators?.slice() || []);
            // setUserSearchTerm('');
            setIsEditDialogOpen(true);
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleSaveProject = async () => {
        try {
            setIsLoading(true);
            
            // Get the current project data to preserve all fields
            const currentProject = await Project.getById(project.id);
            
            // Build update payload with current values + changes
            const updateData: UpdateProjectRequest = {
                title: editForm.title,
                description: editForm.description,
                owner: currentProject.owner,
                collaborators: editForm.collaborators,
                tasklist: currentProject.tasklist || undefined,
            };

            const result = await Project.updateProject(project.id, updateData);
            
            if (result.success) {
                // Create updated project data
                const updatedProjectData: ProjectDto = {
                    ...project,
                    title: result.project?.title || editForm.title,
                    description: result.project?.description || editForm.description,
                    collaborators: editForm.collaborators,
                };
                
                // Update parent component if callback is provided
                if (onProjectUpdate) {
                    onProjectUpdate(updatedProjectData);
                }
                
                setIsEditDialogOpen(false);
            }

            const newCollaborators = editForm.collaborators || [];
            const addedCollaborators = newCollaborators.filter((id) => !oldCollaborators.includes(id));

            if (addedCollaborators.length > 0) {
                const notificationPayload = {
                    resourceType: "project",
                    resourceId: String(project.id),
                    collaboratorIds: addedCollaborators,
                    resourceName: editForm.title,
                    resourceDescription: editForm.description || "",
                    addedBy: profile?.display_name || "Unknown User",
                    priority: 10
                };

                console.log("Notifying collaborator (edit project collaborators):", notificationPayload);

                try {
                    const notifResponse = await NotificationAPI.publishAddedToResource(notificationPayload);
                    console.log("(edit project collaborators) Notified", notifResponse);
                } catch (notifErr) {
                    console.error("(edit project collaborators) Failed", notifErr);
                }
            }
        } catch {
            // Silent error handling
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Top row with back button and action buttons */}
            <div className="flex items-center justify-between">
                <Link to="/app/projects">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleEditProject}
                        disabled={isLoadingEdit}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        {isLoadingEdit ? 'Loading...' : 'Edit Project'}
                    </Button>
                    {userId && (
                        <CreateProjectTask 
                            userId={userId} 
                            projectId={project.id}
                            onTaskCreated={onTaskCreated} 
                        />
                    )}
                </div>
            </div>
            
            {/* Project title in its own row */}
            <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
            </div>

            {/* Edit Project Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter project title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter project description"
                                className="min-h-[100px]"
                            />
                        </div>
                        <CollaboratorPicker
                            mode="project"
                            projectId={project.id}
                            initialSelected={editForm.collaborators}
                            onSaved={(ids) =>
                                setEditForm(prev => ({ ...prev, collaborators: ids }))
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveProject}
                            disabled={isLoading || !editForm.title.trim()}
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProjectHeader;