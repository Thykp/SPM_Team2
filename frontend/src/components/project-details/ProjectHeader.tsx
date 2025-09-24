import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { type ProjectDto, type Task } from '@/lib/api';
import CreateTask from '@/components/task/CreateTask';

interface ProjectHeaderProps {
    project: ProjectDto;
    userId?: string;
    onTaskCreated: (task: Task) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
    project, 
    userId, 
    onTaskCreated 
}) => {
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
                    <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                    </Button>
                    {userId && (
                        <CreateTask userId={userId} onTaskCreated={onTaskCreated} />
                    )}
                </div>
            </div>
            
            {/* Project title in its own row */}
            <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
            </div>
        </div>
    );
};

export default ProjectHeader;