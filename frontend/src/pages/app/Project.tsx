import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Project as ProjectAPI, Profile, type ProjectDto, type NewProjectRequest, type LiteUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectSearch from '@/components/project/ProjectSearch';
import ProjectModal from '@/components/project/ProjectModal';
import ProjectGrid from '@/components/project/ProjectGrid';

interface Project {
    id: string;
    title: string;
    description: string;
    startDate: string;
    members: string[];
}

const Projects: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                // Load users first for collaborator name mapping
                let allUsers: LiteUser[] = [];
                try {
                    allUsers = await Profile.getAllUsers();
                } catch (userErr) {
                    console.error('Error loading users for name mapping:', userErr);
                }
                
                // Use the new endpoint to get projects for the specific user
                const apiProjects = await ProjectAPI.getByUser(user.id);
                
                // Transform API response to component format
                const transformedProjects: Project[] = apiProjects.map((apiProject: ProjectDto) => {
                    // Convert collaborator UUIDs to display names
                    const collaboratorUUIDs = apiProject.collaborators || [];
                    const collaboratorNames = collaboratorUUIDs.map(uuid => {
                        const foundUser = allUsers.find(u => u.id === uuid);
                        if (foundUser) {
                            // Use display_name if available, otherwise use the role and truncated UUID
                            return foundUser.display_name || `${foundUser.role} (${uuid.slice(0, 8)}...)`;
                        }
                        return `User ${uuid.slice(0, 8)}...`;
                    });
                    
                    return {
                        id: apiProject.id,
                        title: apiProject.title || 'Untitled Project',
                        description: apiProject.description || 'No description available',
                        startDate: apiProject.createdat || new Date().toISOString(),
                        members: collaboratorNames
                    };
                });
                
                setProjects(transformedProjects);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch projects');
                setProjects([]); // Set empty projects array on error
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user?.id]);

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleCreateProject = async (projectData: NewProjectRequest) => {
        setIsCreating(true);
        setError(null);

        try {
            const createdProject = await ProjectAPI.create(projectData);
            
            // Load users to map collaborator UUIDs to names
            let collaboratorNames: string[] = [];
            const collaborators = projectData.collaborators || [];
            
            if (collaborators.length > 0) {
                try {
                    const allUsers = await Profile.getAllUsers();
                    collaboratorNames = collaborators.map(uuid => {
                        const foundUser = allUsers.find(u => u.id === uuid);
                        if (foundUser) {
                            return foundUser.display_name || `${foundUser.role} (${uuid.slice(0, 8)}...)`;
                        }
                        return `User ${uuid.slice(0, 8)}...`;
                    });
                } catch (userErr) {
                    console.error('Error loading users for collaborator names:', userErr);
                    // Fallback to just showing UUIDs
                    collaboratorNames = collaborators.map(uuid => `User ${uuid.slice(0, 8)}...`);
                }
            }
            
            // Transform API response to component format and add to local state
            const newProjectForState: Project = {
                id: createdProject.id,
                title: createdProject.title || projectData.title,
                description: createdProject.description || projectData.description,
                startDate: createdProject.createdat || new Date().toISOString(),
                members: collaboratorNames
            };

            setProjects(prev => [newProjectForState, ...prev]);
            
            // Show success message
            setSuccessMessage('Project created successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Failed to create project:', error);
            setError(error instanceof Error ? error.message : 'Failed to create project');
            throw error; // Re-throw so modal can handle it
        } finally {
            setIsCreating(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setError(null);
        setSuccessMessage(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ProjectHeader onNewProjectClick={() => setShowModal(true)} />
            
            <ProjectSearch 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800">{successMessage}</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            <ProjectGrid 
                projects={filteredProjects} 
                onCreateProject={() => setShowModal(true)}
            />

            <ProjectModal
                show={showModal}
                onClose={handleModalClose}
                onCreateProject={handleCreateProject}
                isCreating={isCreating}
                error={error}
                currentUserId={user?.id}
            />
        </div>
    );
};

export default Projects;