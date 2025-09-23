import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MoreHorizontal } from 'lucide-react';

interface Project {
    id: string;
    title: string;
    description: string;
    startDate: string;
    members: string[];
}

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    return (
        <Link to={`/app/project/${project.id}`} className="block">
            <Card className="hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                {project.title}
                            </CardTitle>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.preventDefault()} // Prevent navigation when clicking the button
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                </p>

                {/* Project Info */}
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{project.members.length} members</span>
                    </div>
                </div>

                {/* Team Members Preview */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member) => (
                            <div
                                key={member}
                                className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                                title={member}
                            >
                                {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                        ))}
                        {project.members.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{project.members.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        </Link>
    );
};

export default ProjectCard;