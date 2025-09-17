import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Users, Plus, Search, MoreHorizontal, X } from 'lucide-react';

// Updated interface for project list display
interface Project {
    id: string;
    title: string;
    description: string;
    startDate: string;
    members: string[];
}

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        collaborators: ''
    });

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Replace with your actual API call to get user's projects
                const response = await fetch('/api/user/projects');
                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }
                const data = await response.json();
                setProjects(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                // Mock data for development
                setProjects([
                    {
                        id: '1',
                        title: 'E-Commerce Platform',
                        description: 'Building a modern e-commerce platform with React and Node.js',
                        startDate: '2024-01-15',
                        members: ['John Doe', 'Jane Smith', 'Mike Johnson']
                    },
                    {
                        id: '2',
                        title: 'Mobile App Development',
                        description: 'Cross-platform mobile app using React Native',
                        startDate: '2024-03-01',
                        members: ['Sarah Wilson', 'Tom Brown']
                    },
                    {
                        id: '3',
                        title: 'Data Analytics Dashboard',
                        description: 'Real-time analytics dashboard for business intelligence',
                        startDate: '2023-09-01',
                        members: ['Alice Cooper', 'Bob Smith', 'Carol Davis', 'David Lee']
                    },
                    {
                        id: '4',
                        title: 'API Documentation',
                        description: 'Comprehensive API documentation and developer guides',
                        startDate: '2024-02-01',
                        members: ['Emma White', 'Frank Miller']
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Parse collaborators from comma-separated string
        const collaboratorsList = newProject.collaborators
            .split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        const projectData = {
            id: Date.now().toString(), // Simple ID generation
            title: newProject.title,
            description: newProject.description,
            startDate: new Date().toISOString().split('T')[0],
            members: collaboratorsList
        };

        try {
            // Here you would normally make an API call to create the project
            // const response = await fetch('/api/projects', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(projectData)
            // });
            
            // For now, just add to the local state
            setProjects(prev => [projectData, ...prev]);
            
            // Reset form and close modal
            setNewProject({ title: '', description: '', collaborators: '' });
            setShowModal(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setNewProject({ title: '', description: '', collaborators: '' });
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Projects</h1>
                    <p className="text-muted-foreground">Manage and track your project progress</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                </Button>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                    <p className="text-sm text-red-600 mt-1">Showing sample data for demonstration</p>
                </div>
            )}

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground">No projects found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <CardTitle className="text-lg line-clamp-2">
                                            <Link 
                                                to={`/app/project/${project.id}`}
                                                className="hover:text-primary transition-colors"
                                            >
                                                {project.title}
                                            </Link>
                                        </CardTitle>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    ))}
                </div>
            )}

            {/* New Project Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl shadow-2xl">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl">Create New Project</CardTitle>
                                    <p className="text-muted-foreground mt-1">
                                        Start a new project and invite your team to collaborate
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleModalClose}
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        
                        <CardContent>
                            <form onSubmit={handleCreateProject} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-base font-medium">
                                        Project Title
                                    </Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="Enter a descriptive project title"
                                        value={newProject.title}
                                        onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                                        className="h-11"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base font-medium">
                                        Project Description
                                    </Label>
                                    <textarea
                                        id="description"
                                        className="w-full px-3 py-3 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none min-h-[100px]"
                                        placeholder="Describe the project goals, scope, and key objectives..."
                                        value={newProject.description}
                                        onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="collaborators" className="text-base font-medium">
                                        Team Members
                                    </Label>
                                    <Input
                                        id="collaborators"
                                        type="text"
                                        placeholder="John Doe, Jane Smith, Mike Johnson..."
                                        value={newProject.collaborators}
                                        onChange={(e) => setNewProject(prev => ({ ...prev, collaborators: e.target.value }))}
                                        className="h-11"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Enter team member names separated by commas (optional)
                                    </p>
                                </div>
                                
                                <div className="flex gap-3 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleModalClose}
                                        className="flex-1 h-11"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-11"
                                        disabled={!newProject.title.trim() || !newProject.description.trim()}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Project
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Projects;