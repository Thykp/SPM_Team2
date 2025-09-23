import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProjectHeaderProps {
    onNewProjectClick: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onNewProjectClick }) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold">My Projects</h1>
                <p className="text-muted-foreground">Manage and track your project progress</p>
            </div>
            <Button onClick={onNewProjectClick}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
            </Button>
        </div>
    );
};

export default ProjectHeader;