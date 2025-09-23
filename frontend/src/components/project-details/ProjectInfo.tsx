import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users } from 'lucide-react';
import { type ProjectDto } from '@/lib/api';

interface ProjectInfoProps {
    project: ProjectDto;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ project }) => {
    const createdDate = project.createdat ? new Date(project.createdat) : new Date();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    {project.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{(project.collaborators?.length || 0) + 1} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started {createdDate.toLocaleDateString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProjectInfo;