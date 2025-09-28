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
  startDate: string;
  members: string[];
}

// Inline user type (replaces removed LiteUser)
type UserRow = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

// Helper: make a map { userId -> { display_name, role } }
function buildUserMap(users: UserRow[]) {
  const map: Record<string, { display_name: string; role: string }> = {};
  for (const u of users) {
    map[u.id] = { display_name: u.display_name, role: u.role };
  }
  return map;
}

// Helper: convert collaborator UUIDs to display labels using a cached map
function idsToNames(
  ids: string[] | null | undefined,
  map: Record<string, { display_name: string; role: string }>
) {
  const arr = ids ?? [];
  return arr.map((uuid) => {
    const u = map[uuid];
    if (u) {
      return u.display_name || `${u.role} (${uuid.slice(0, 8)}...)`;
    }
    return `User ${uuid.slice(0, 8)}...`;
  });
}

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cache users for UUID→name mapping
  const [userMap, setUserMap] = useState<
    Record<string, { display_name: string; role: string }>
  >({});

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load users first for collaborator name mapping (safe even if it fails)
        try {
          const allUsers = (await Profile.getAllUsers()) as UserRow[];
          setUserMap(buildUserMap(allUsers));
        } catch (userErr) {
          console.error("Error loading users for name mapping:", userErr);
          setUserMap({});
        }

        // Get projects for the specific user
        const apiProjects = await ProjectAPI.getByUser(user.id);

        // Transform API response to component format
        const transformed: Project[] = apiProjects.map((apiProject: ProjectDto) => ({
          id: apiProject.id,
          title: apiProject.title || "Untitled Project",
          description: apiProject.description || "No description available",
          startDate: apiProject.createdat || new Date().toISOString(),
          members: idsToNames(apiProject.collaborators, userMap),
        }));

        setProjects(transformed);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch projects"
        );
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    // We intentionally omit userMap from deps; we want a single load pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Prefer cached userMap; if empty and we have collaborators, try fetching users once
      let map = userMap;
      if (
        (!map || Object.keys(map).length === 0) &&
        (projectData.collaborators?.length ?? 0) > 0
      ) {
        try {
          const allUsers = (await Profile.getAllUsers()) as UserRow[];
          map = buildUserMap(allUsers);
          setUserMap(map);
        } catch (userErr) {
          console.error("Error loading users for collaborator names:", userErr);
        }
      }

      const collaboratorNames = idsToNames(projectData.collaborators, map);

      // Transform API response to component format and add to local state
      const newProjectForState: Project = {
        id: createdProject.id,
        title: createdProject.title || projectData.title,
        description: createdProject.description || projectData.description,
        startDate: createdProject.createdat || new Date().toISOString(),
        members: collaboratorNames,
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
