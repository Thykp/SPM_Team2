import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Crown } from 'lucide-react';
import { type ProjectDto } from '@/lib/api';

interface ProjectInfoProps {
    project: ProjectDto;
    ownerName?: string | null;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ project, ownerName }) => {
    const createdDate = project.created_at ? new Date(project.created_at) : new Date();
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
                    {ownerName && (
                        <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span>Owner: {ownerName}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{(project.collaborators?.length || 0)} members</span>
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