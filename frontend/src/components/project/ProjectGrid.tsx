import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProjectCard from './ProjectCard';

// Define the Project interface for the UI component
interface ProjectUIData {
    id: string;
    title: string;
    description: string;
    startDate: string | null;
    members: string[];
    owner?: string;
}

interface ProjectGridProps {
    projects: ProjectUIData[];
    onCreateProject?: () => void;
    onProjectUpdate?: (updatedProject: ProjectUIData) => void;
    onProjectDelete?: (projectId: string) => void;
}

const ProjectGrid: React.FC<ProjectGridProps> = ({ 
    projects, 
    onCreateProject, 
    onProjectUpdate, 
    onProjectDelete 
}) => {
    if (projects.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground">No projects found</h3>
                <p className="text-muted-foreground mb-6">Get started by creating your first project</p>
                {onCreateProject && (
                    <Button onClick={onCreateProject}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onProjectUpdate={onProjectUpdate}
                    onProjectDelete={onProjectDelete}
                />
            ))}
        </div>
    );
};

export default ProjectGrid;