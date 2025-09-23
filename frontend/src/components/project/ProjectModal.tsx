import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';
import { Profile, type NewProjectRequest, type LiteUser } from '@/lib/api';
import CollaboratorPicker from './CollaboratorPickerNewProj';

interface ProjectModalProps {
    show: boolean;
    onClose: () => void;
    onCreateProject: (projectData: NewProjectRequest) => Promise<void>;
    isCreating: boolean;
    error: string | null;
    currentUserId?: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
    show,
    onClose,
    onCreateProject,
    isCreating,
    error,
    currentUserId
}) => {
    // User selection for collaborators
    const [users, setUsers] = useState<LiteUser[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    const [newProject, setNewProject] = useState({
        title: '',
        description: ''
    });

    // Load users for collaborator selection
    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoadingUsers(true);
                const allUsers = await Profile.getAllUsers();
                setUsers(allUsers);
            } catch (err) {
                console.error('Error loading users:', err);
            } finally {
                setLoadingUsers(false);
            }
        };

        if (show) {
            loadUsers();
        }
    }, [show]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentUserId) {
            console.error('User not authenticated');
            return;
        }

        const projectData: NewProjectRequest = {
            title: newProject.title,
            description: newProject.description,
            owner: currentUserId,
            collaborators: selectedCollaborators,
            tasklist: []
        };

        await onCreateProject(projectData);
        
        // Reset form if successful (onCreateProject should handle errors)
        if (!error) {
            handleClose();
        }
    };

    const handleClose = () => {
        setNewProject({ title: '', description: '' });
        setSelectedCollaborators([]);
        setUserSearchTerm('');
        onClose();
    };

    const toggleCollaborator = (userId: string) => {
        setSelectedCollaborators(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl">Create New Project</CardTitle>
                            <p className="text-muted-foreground mt-1">
                                Start a new project and invite your team to collaborate
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-medium">
                                Project Title
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Enter a descriptive project title"
                                value={newProject.title}
                                onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                                className="h-11"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-base font-medium">
                                Project Description
                            </Label>
                            <textarea
                                id="description"
                                className="w-full px-3 py-3 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none min-h-[100px]"
                                placeholder="Describe the project goals, scope, and key objectives..."
                                value={newProject.description}
                                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                                required
                            />
                        </div>
                        
                        <CollaboratorPicker
                            users={users}
                            userSearchTerm={userSearchTerm}
                            onUserSearchChange={setUserSearchTerm}
                            selectedCollaborators={selectedCollaborators}
                            onToggleCollaborator={toggleCollaborator}
                            loadingUsers={loadingUsers}
                            currentUserId={currentUserId}
                        />
                        
                        <div className="flex gap-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 h-11"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-11"
                                disabled={!newProject.title.trim() || !newProject.description.trim() || isCreating}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Project
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProjectModal;