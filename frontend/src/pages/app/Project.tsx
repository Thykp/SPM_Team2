import React, { useState, useEffect, useMemo } from "react";
import Loader from "@/components/layout/Loader";
import {
  Project as ProjectAPI,
  Profile,
  type ProjectDto,
  type NewProjectRequest,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ProjectHeader from "@/components/project/ProjectHeader";
import ProjectSearch from "@/components/project/ProjectSearch";
import ProjectModal from "@/components/project/ProjectModal";
import ProjectGrid from "@/components/project/ProjectGrid";

interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  members: string[];
  owner?: string;
  ownerId?: string;
}

// User type for API response
type UserRow = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

// Helper functions to reduce nesting
const getUserDisplayName = (userId: string | null, users: UserRow[]): string => {

  if (!Array.isArray(users)) {
    console.error("Invalid users array:", users); // Debugging log
    return "Unknown User";
  }

  console.log("User ID:", userId); // Debugging log
  console.log("All Users:", users);

  if (!userId) {
    return "Unknown User";
  }
  const foundUser = users.find(u => u.id === userId);
  if (foundUser) {
    return foundUser.display_name || `${foundUser.role} (${userId.slice(0, 8)}...)`;
  }
  return `User ${userId.slice(0, 8)}...`;
};

const getCollaboratorNames = (collaboratorUUIDs: string[], users: UserRow[]): string[] => {
  return collaboratorUUIDs.map(uuid => getUserDisplayName(uuid, users));
};

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
                let allUsers: UserRow[] = [];
                try {
                    const response = await Profile.getAllUsers();
                    // Handle both direct array and { data: array } formats
                    allUsers = Array.isArray(response) ? response : (response as any).data || [];
                    console.log("All Users:", allUsers);
                } catch (userErr) {
                    console.error('Error loading users for name mapping:', userErr);
                }
                
                // Use the new endpoint to get projects for the specific user
                const apiProjects = await ProjectAPI.getByUser(user.id);
                console.log("API Projects:", apiProjects);
                
                // Transform API response to component format
                const transformedProjects: Project[] = apiProjects.map((apiProject: ProjectDto) => {
                    console.log("Transforming Project:", apiProject);
                    console.log("All Users During Transformation:", allUsers);

                    // Convert collaborator UUIDs to display names
                    const collaboratorUUIDs = apiProject.collaborators || [];
                    const collaboratorNames = getCollaboratorNames(collaboratorUUIDs, allUsers);

                    // Get owner display name
                    const ownerName = getUserDisplayName(apiProject.owner, allUsers);
                    console.log("Owner Name Debug:", { ownerId: apiProject.owner, allUsers });
                    
                    return {
                        id: apiProject.id,
                        title: apiProject.title || 'Untitled Project',
                        description: apiProject.description || 'No description available',
                        startDate: apiProject.created_at || new Date().toISOString(),
                        members: collaboratorNames,
                        owner: ownerName,
                        ownerId: apiProject.owner
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

  const filteredProjects = useMemo(() => {
    const q = (searchTerm || "").toLowerCase();
    return projects.filter((p) => {
      const t = p.title.toLowerCase();
      const d = p.description.toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [projects, searchTerm]);

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
                    collaboratorNames = getCollaboratorNames(collaborators, allUsers);
                } catch (userErr) {
                    console.error('Error loading users for collaborator names:', userErr);
                    // Fallback to just showing UUIDs
                    collaboratorNames = collaborators.map(uuid => `User ${uuid.slice(0, 8)}...`);
                }
            }
            
            // Get owner display name
            let ownerName = `User ${createdProject.owner.slice(0, 8)}...`;
            try {
                const allUsers = await Profile.getAllUsers();
                ownerName = getUserDisplayName(createdProject.owner, allUsers);
            } catch (userErr) {
                console.error('Error loading owner info:', userErr);
            }

            // Transform API response to component format and add to local state
            const newProjectForState: Project = {
                id: createdProject.id,
                title: createdProject.title || projectData.title,
                description: createdProject.description || projectData.description,
                startDate: createdProject.created_at || new Date().toISOString(),
                members: collaboratorNames,
                owner: ownerName,
                ownerId: createdProject.owner
            };

      setProjects((prev) => [newProjectForState, ...prev]);

      // Success toast
      setSuccessMessage("Project created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
      throw err; // let modal handle it too
    } finally {
      setIsCreating(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setSuccessMessage("Project deleted successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        aria-busy="true"
        aria-live="polite"
      >
        <Loader />
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
        currentUserId={user?.id}
        onCreateProject={() => setShowModal(true)}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
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
