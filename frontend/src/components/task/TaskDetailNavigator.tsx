import { useState, useEffect, useRef } from "react";
import type { TaskDTO as taskType } from "@/lib/api";
import { TaskDetail } from "./TaskDetail";

type TaskDetailNavigatorProps = {
    initialTask: taskType;
    isOpen: boolean;
    onClose: () => void;
}

export function TaskDetailNavigator({ initialTask, isOpen, onClose }: TaskDetailNavigatorProps) {
    const [navigationStack, setNavigationStack] = useState<taskType[]>([initialTask]);
    const lastTaskIdRef = useRef<string>(initialTask.id);
    
    // Reset navigation stack when task ID changes (new task selected) or when dialog opens
    // Update task data when same task but data changed (enrichment)
    useEffect(() => {
        if (isOpen) {
            if (initialTask.id !== lastTaskIdRef.current) {
                // Different task - reset navigation stack
                setNavigationStack([initialTask]);
                lastTaskIdRef.current = initialTask.id;
            } else {
                // Same task but potentially updated data - update the current task in stack
                setNavigationStack(prev => {
                    const newStack = [...prev];
                    newStack[0] = initialTask; // Update the root task with latest data
                    return newStack;
                });
            }
        }
    }, [initialTask, isOpen]);

    // Current task is always the last item in the stack
    const currentTask = navigationStack[navigationStack.length - 1];
    
    // Parent task exists if we have more than one item in the stack
    const parentTask = navigationStack.length > 1 ? navigationStack[navigationStack.length - 2] : undefined;

    const handleNavigateToSubtask = (subtask: taskType) => {
        // Add the subtask to the navigation stack
        setNavigationStack(prev => [...prev, subtask]);
    };

    const handleNavigateBack = () => {
        // Remove the current task from the stack (go back to parent)
        setNavigationStack(prev => prev.slice(0, -1));
    };

    const handleClose = () => {
        // Reset navigation stack when closing
        setNavigationStack([initialTask]);
        onClose();
    };

    return (
        <TaskDetail
            key={`task-detail-${currentTask.id}-${isOpen}`}
            currentTask={currentTask}
            isOpen={isOpen}
            onClose={handleClose}
            parentTask={parentTask}
            onNavigateToSubTask={handleNavigateToSubtask}
            onNavigateBack={handleNavigateBack}
        />
    );
}