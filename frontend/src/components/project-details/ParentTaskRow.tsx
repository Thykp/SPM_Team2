import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type TaskDTO } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SubtaskCard from './SubtaskCard';

interface ParentTaskRowProps {
    parentTask: TaskDTO;
    subtasks: TaskDTO[];
    statuses: Array<{ id: string; title: string }>;
    projectId: string;
    currentUserId?: string;
    onSubtaskClick?: (subtask: TaskDTO) => void;
    onSubtaskDeleted?: (subtaskId: string) => void;
    onSubtaskUpdated?: () => void;
}

const ParentTaskRow: React.FC<ParentTaskRowProps> = ({ 
    parentTask, 
    subtasks, 
    statuses,
    projectId,
    currentUserId,
    onSubtaskClick,
    onSubtaskDeleted,
    onSubtaskUpdated
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

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

    // Group subtasks by status
    const subtasksByStatus: Record<string, TaskDTO[]> = {};
    statuses.forEach(status => {
        subtasksByStatus[status.id] = subtasks.filter(st => {
            const statusMap: Record<string, TaskDTO['status']> = {
                'unassigned': 'Unassigned',
                'ongoing': 'Ongoing',
                'under-review': 'Under Review',
                'completed': 'Completed',
                'overdue': 'Overdue',
            };
            return st.status === statusMap[status.id];
        });
    });

    return (
        <div className="mb-4">
            {/* Parent Task Header Row */}
            <div 
                className="flex items-center gap-3 p-3 bg-white border-l-4 border-l-blue-500 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow mb-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Expand/Collapse Icon */}
                <button className="flex-shrink-0 hover:bg-gray-100 rounded p-1">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>

                {/* Parent Task Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                        {parentTask.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                        {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(parentTask.status)}`}>
                        {parentTask.status}
                    </Badge>
                </div>

                {/* Parent Task Owner */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {parentTask.priority && (
                        <Badge variant="outline" className="text-xs">
                            P{parentTask.priority}
                        </Badge>
                    )}
                    {parentTask.ownerName ? (
                        <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                                {getInitials(parentTask.ownerName)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">?</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </div>

            {/* Subtasks Grid - Displayed when expanded */}
            {isExpanded && subtasks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pl-8">
                    {statuses.map((status) => (
                        <div key={status.id} className="space-y-2">
                            {subtasksByStatus[status.id]?.map((subtask) => (
                                <SubtaskCard
                                    key={subtask.id}
                                    subtask={subtask}
                                    projectId={projectId}
                                    currentUserId={currentUserId}
                                    onClick={() => onSubtaskClick?.(subtask)}
                                    onSubtaskDeleted={onSubtaskDeleted}
                                    onSubtaskUpdated={onSubtaskUpdated}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParentTaskRow;
