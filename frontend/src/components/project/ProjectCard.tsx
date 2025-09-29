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
    startDate: string;
    members: string[];
    owner?: string;
}

interface ProjectCardProps {
    project: ProjectUIData;
    onProjectUpdate?: (updatedProject: ProjectUIData) => void;
    onProjectDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onProjectUpdate, onProjectDelete }) => {
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
            
            // Build update payload with current values + changes
            const updateData: UpdateProjectRequest = {
                title: editForm.title,
                description: editForm.description,
                // Preserve existing fields to prevent them from being nullified
                owner: currentProject.owner,
                collaborators: editForm.collaborators,
                tasklist: currentProject.tasklist || undefined,
            };

            console.log('Update payload:', updateData);

            const result = await Project.updateProject(project.id, updateData);
            
            if (result.success) {
                console.log('Project updated successfully:', result);
                
                // Get the updated project data from the API response or fetch fresh data
                let updatedProjectData: ProjectUIData;
                if (result.project) {
                    // Use the returned data from the update API
                    updatedProjectData = {
                        ...project,
                        title: result.project.title || editForm.title,
                        description: result.project.description || editForm.description,
                        members: project.members, // Keep existing UI structure
                    };
                } else {
                    // Fallback to form data if no data in response
                    updatedProjectData = {
                        ...project,
                        title: editForm.title,
                        description: editForm.description,
                        members: project.members,
                    };
                }
                
                // Update local state for immediate UI update
                setLocalProject(updatedProjectData);
                
                // Update parent component if callback is provided
                if (onProjectUpdate) {
                    onProjectUpdate(updatedProjectData);
                }
                
                setIsEditDialogOpen(false);
            } else {
                console.error('Update failed:', result);
            }
        } catch (error) {
            console.error('Failed to update project:', error);
            // You could add a toast notification here
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            setIsLoading(true);
            
            // TODO: Implement delete project API endpoint
            // const result = await Project.deleteProject(project.id);
            
            if (onProjectDelete) {
                onProjectDelete(project.id);
            }
            
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error('Failed to delete project:', error);
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
                                        onClick={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }}
                                        className="text-destructive"
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
                        <span>Started: {new Date(localProject.startDate).toLocaleDateString()}</span>
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