import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Users, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface Project {
    id: string;
    title: string;
    description: string;
    startDate: string;
    members: string[];
}

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                // Replace with your actual API call
                const response = await fetch(`/api/projects/${projectId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch project');
                }
                const data = await response.json();
                setProject(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                // Mock data for development
                setProject({
                    id: projectId || '1',
                    title: 'E-Commerce Platform',
                    description: 'Building a modern e-commerce platform with React and Node.js. This project includes user authentication, product catalog, shopping cart, payment processing, and order management features.',
                    startDate: '2024-01-15',
                    members: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/app/projects">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Projects
                        </Button>
                    </Link>
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Error</h1>
                    <p className="text-muted-foreground">{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">Showing sample data for demonstration</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/app/projects">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Projects
                        </Button>
                    </Link>
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
                    <p className="text-muted-foreground">The requested project could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/app/projects">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Projects
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{project.title}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                    </Button>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-6">{project.description}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Team Members
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {project.members.map((member) => (
                                    <div key={member} className="flex items-center gap-3 p-3 border rounded-lg">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                            {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{member}</p>
                                            <p className="text-sm text-muted-foreground">Team Member</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Start Date</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(project.startDate).toLocaleDateString()}
                                </p>
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Team Size</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {project.members.length} members
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
