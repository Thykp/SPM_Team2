import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type TaskDTO } from '@/lib/api';
import { Check } from 'lucide-react';

interface SubtaskCardProps {
    subtask: TaskDTO;
    onClick?: () => void;
}

const SubtaskCard: React.FC<SubtaskCardProps> = ({ subtask, onClick }) => {
    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusColor = (status: TaskDTO['status']) => {
        switch (status) {
            case 'Unassigned':
                return 'bg-gray-100 text-gray-700';
            case 'Ongoing':
                return 'bg-blue-100 text-blue-700';
            case 'Under Review':
                return 'bg-yellow-100 text-yellow-700';
            case 'Completed':
                return 'bg-green-100 text-green-700';
            case 'Overdue':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-slate-300"
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {subtask.status === 'Completed' && (
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium truncate flex-1">{subtask.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {subtask.priority && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                P{subtask.priority}
                            </Badge>
                        )}
                        <Badge className={`text-xs ${getStatusColor(subtask.status)}`}>
                            {subtask.status}
                        </Badge>
                        {subtask.ownerName ? (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                    {getInitials(subtask.ownerName)}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">?</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SubtaskCard;
