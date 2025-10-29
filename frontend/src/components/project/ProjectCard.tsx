import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MoreHorizontal, Crown, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CollaboratorPicker from '@/components/project/CollaboratorPickerNewProj';
import { Project, Profile, type UpdateProjectRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Notification as NotificationAPI } from '@/lib/api';

// Define LiteUser type based on the API response structure
type LiteUser = {
    id: string;
    display_name: string;
    role: string;
    department: string;
};

// Define the Project interface for the UI component
interface ProjectUIData {
    id: string;
    title: string;
    description: string;
    startDate: string | null;
    members: string[];
    owner?: string;
    ownerId?: string;
}

interface ProjectCardProps {
    project: ProjectUIData;
    currentUserId?: string;
    onProjectUpdate?: (updatedProject: ProjectUIData) => void;
    onProjectDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, currentUserId, onProjectUpdate, onProjectDelete }) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [localProject, setLocalProject] = useState<ProjectUIData>(project);
    const [editForm, setEditForm] = useState({
        title: project.title,
        description: project.description,
        collaborators: project.members || [],
    });
    
    // State for collaborator picker
    const [users, setUsers] = useState<LiteUser[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [currentProjectData, setCurrentProjectData] = useState<any>(null);

    // State for notification
    const {profile} = useAuth();
    const [originalCollaborators, setOriginalCollaborators] = useState<string[]>([]);

    // Update local project when the prop changes
    useEffect(() => {
        setLocalProject(project);
    }, [project]);

    // Load users when edit dialog opens
    useEffect(() => {
        if (isEditDialogOpen && users.length === 0) {
            setLoadingUsers(true);
            Profile.getAllUsers()
                .then((data) => {
                    setUsers(data);
                })
                .catch(console.error)
                .finally(() => {
                    setLoadingUsers(false);
                });
        }
    }, [isEditDialogOpen, users.length]);

    // Helper function to toggle collaborator selection
    const handleToggleCollaborator = (userId: string) => {
        setEditForm(prev => ({
            ...prev,
            collaborators: prev.collaborators.includes(userId)
                ? prev.collaborators.filter(id => id !== userId)
                : [...prev.collaborators, userId]
        }));
    };

    const handleEditProject = async () => {
        try {
            setIsLoadingEdit(true);
            // Fetch current project data to get proper collaborator UUIDs
            const currentProject = await Project.getById(project.id);
            setCurrentProjectData(currentProject);
            setEditForm({
                title: project.title,
                description: project.description,
                collaborators: currentProject.collaborators || [],
            });
            setOriginalCollaborators(currentProject.collaborators || []);
            console.log("Original collaborators:", currentProject.collaborators);
            setUserSearchTerm(''); // Reset search term
            setIsEditDialogOpen(true);
        } catch (error) {
            console.error('Error fetching project data for edit:', error);
            // Fallback to local data
            setEditForm({
                title: project.title,
                description: project.description,
                collaborators: [],
            });
            setUserSearchTerm('');
            setIsEditDialogOpen(true);
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleSaveProject = async () => {
        try {
            setIsLoading(true);
            
            console.log('Project data:', project);
            console.log('Edit form data:', editForm);
            
            // First get the current project data to preserve all fields
            const currentProject = await Project.getById(project.id);
            console.log('Current project from API:', currentProject);

            // Update collaborators
            if (editForm.collaborators) {
            console.log("Updating collaborators...");
            console.log("Payload for updateCollaborators:", {
                projectId: project.id,
                collaborators: editForm.collaborators,
            });
            const collaboratorsResult = await Project.updateCollaborators(
                project.id,
                editForm.collaborators
            );
            console.log("Collaborators update result:", collaboratorsResult);
            }


            // checking and notifying collaborators
            const updatedCollaborators = editForm.collaborators || [];
            const newlyAdded = updatedCollaborators.filter((id) => !originalCollaborators.includes(id));

            console.log("New collaborators detected:", newlyAdded);


            // Build update payload with current values + changes
            const updateData: UpdateProjectRequest = {
                title: editForm.title,
                description: editForm.description,
            };

            console.log('Update payload:', updateData);

            const result = await Project.updateProject(project.id, updateData);
            
            if (result.success) {
                console.log('Project updated successfully:', result);
                
                const updatedProject = await Project.getById(project.id);
                console.log("Updated project from API:", updatedProject);
                // Transform the API response to match the ProjectUIData structure
                const updatedProjectData: ProjectUIData = {
                    id: updatedProject.id,
                    title: updatedProject.title,
                    description: updatedProject.description,
                    startDate: updatedProject.created_at ?? null,
                    members: updatedProject.collaborators || [],
                    owner: updatedProject.owner,
                };
                
                // Update local state for immediate UI update
                setLocalProject(updatedProjectData);
                
                // Update parent component if callback is provided
                if (onProjectUpdate) {
                    onProjectUpdate(updatedProjectData);
                }
                const hasNonOwnerChanges =
                    (updatedProject.title !== currentProject.title ||
                    updatedProject.description !== currentProject.description);

                const collaboratorsToNotify = updatedProjectData.members.filter(id => id !== profile?.id) || [];

                if (hasNonOwnerChanges && collaboratorsToNotify.length != 0) {
                    await NotificationAPI.publishUpdate({
                        updateType: "Edited",
                        resourceType: "project",
                        resourceId:updatedProject.id,
                        resourceContent: { 
                            updated: {...updatedProject},
                            original: {...currentProject}
                        },
                        collaboratorIds: collaboratorsToNotify,
                        updatedBy: profile?.display_name || "Unknown User",
                    });
                }

                if (updatedProject.owner != currentProject.owner){
                    await NotificationAPI.publishUpdate({
                        updateType: "Assigned",
                        resourceType: "project",
                        resourceId:updatedProject.id,
                        resourceContent: { 
                            updated: {...updatedProject},
                            original: {...currentProject}
                        },
                        collaboratorIds: [updatedProject.owner],
                        updatedBy: profile?.display_name || "Unknown User",
                    });
                }
                
                setIsEditDialogOpen(false);

                if (newlyAdded.length > 0) {
                    try {
                        console.log("Publishing notification for new collaborators...");

                        await NotificationAPI.publishAddedToResource({
                            resourceId: project.id,
                            resourceType: "project",
                            collaboratorIds: newlyAdded,
                            resourceContent:{ 
                                updated: {...updatedProjectData},
                                original: {...currentProjectData}
                            },
                            addedBy: profile?.display_name || "unknown",
                        }); 
                        console.log(JSON.stringify({
                            resourceId: project.id,
                            resourceType: "project",
                            resourceContent:{ ...updatedProjectData },
                            collaboratorIds: newlyAdded,
                            addedBy: profile?.display_name || "unknown",
                        }))

                        console.log("Notification published for new collaborators:", newlyAdded);
                    } catch (notifyError) {
                        console.error("Failed to publish notification:", notifyError);
                    }

                }
            } else {
                console.error('Update failed:', result);
            }
        } catch (error) {
            console.error('Failed to update project:', error);
            
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            setIsLoading(true);
            
            const result = await Project.delete(project.id);
            
            if (result.success) {
                console.log('Project deleted successfully');
                
                // Notify parent component about deletion
                if (onProjectDelete) {
                    onProjectDelete(project.id);
                }
                
                setIsDeleteDialogOpen(false);
            } else {
                console.error('Delete failed:', result);
                // You could show an error toast here
            }
        } catch (error) {
            console.error('Failed to delete project:', error);
            // You could show an error toast here
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div>
            <Link to={`/app/project/${localProject.id}`} className="block">
                <Card className="hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                    {localProject.title}
                                </CardTitle>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.preventDefault()} // Prevent navigation when clicking the button
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); void handleEditProject(); }} disabled={isLoadingEdit}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        {isLoadingEdit ? 'Loading...' : 'Edit Project'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        disabled={!currentUserId || !project.ownerId || currentUserId !== project.ownerId}
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            if (currentUserId && project.ownerId && currentUserId === project.ownerId) {
                                                setIsDeleteDialogOpen(true);
                                            }
                                        }}
                                        className={
                                            !currentUserId || !project.ownerId || currentUserId !== project.ownerId 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "text-destructive"
                                        }
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Project
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {localProject.description}
                </p>

                {/* Project Info */}
                <div className="space-y-2 text-sm text-muted-foreground">
                    {localProject.owner && (
                        <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span>Owner: {localProject.owner}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {localProject.startDate ? new Date(localProject.startDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{localProject.members.length} collaborators</span>
                    </div>
                </div>

                {/* Team Members Preview */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {localProject.members.slice(0, 3).map((member) => (
                            <div
                                key={member}
                                className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                                title={member}
                            >
                                {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                        ))}
                        {localProject.members.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{localProject.members.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        </Link>

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
                        users={users}
                        userSearchTerm={userSearchTerm}
                        onUserSearchChange={setUserSearchTerm}
                        selectedCollaborators={editForm.collaborators}
                        onToggleCollaborator={handleToggleCollaborator}
                        loadingUsers={loadingUsers}
                        currentUserId={currentProjectData?.owner || localProject.owner}
                        disabled={profile?.id !== localProject.ownerId}
                    />
                    {profile?.id !== localProject.ownerId && (
                        <p className="text-sm text-muted-foreground">
                            Only the project owner can modify the collaborators.
                        </p>
                    )}
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
                    disabled={
                        isLoading || 
                        !editForm.title.trim() || 
                        !editForm.description.trim() // Ensure description is not empty
                    }
                    >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Project Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete "<span className="font-medium">{project.title}</span>"? 
                        This action cannot be undone.
                    </p>
                </div>
                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => setIsDeleteDialogOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={handleDeleteProject}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : 'Delete Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </div>
    );
};

export default ProjectCard;