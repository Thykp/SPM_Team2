import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { type Task } from '@/lib/api';

interface UseRealtimeTasksProps {
  projectId: string;
  initialTasks: Task[];
  onTaskUpdate?: (updatedTask: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskInsert?: (newTask: Task) => void;
}

export const useRealtimeTasks = ({
  projectId,
  initialTasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskInsert,
}: UseRealtimeTasksProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to avoid including callbacks in dependencies
  const callbacksRef = useRef({
    onTaskUpdate,
    onTaskDelete,
    onTaskInsert,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onTaskUpdate,
      onTaskDelete,
      onTaskInsert,
    };
  }, [onTaskUpdate, onTaskDelete, onTaskInsert]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    // Extract state update functions to reduce nesting
    const updateTaskInState = (updatedTask: Task) => {
      setTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(task => task.id === updatedTask.id);
        if (taskIndex === -1) return prevTasks;
        
        const newTasks = [...prevTasks];
        newTasks[taskIndex] = updatedTask;
        return newTasks;
      });
    };

    const removeTaskFromState = (taskId: string) => {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const addTaskToState = (newTask: Task) => {
      setTasks(prevTasks => {
        // Check if task already exists to avoid duplicates
        const taskExists = prevTasks.some(task => task.id === newTask.id);
        if (taskExists) return prevTasks;
        
        return [...prevTasks, newTask];
      });
    };
    
    const channel = supabase
      .channel(`project-${projectId}-tasks`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'revamped_task',
      }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'UPDATE' && newRecord) {
          const updatedTask = transformTaskFromDb(newRecord);
          // Only process tasks that belong to the current project
          if (updatedTask.project_id === projectId) {
            updateTaskInState(updatedTask);
            callbacksRef.current.onTaskUpdate?.(updatedTask);
          }
        }

        if (eventType === 'INSERT' && newRecord) {
          const newTask = transformTaskFromDb(newRecord);
          // Only process tasks that belong to the current project
          if (newTask.project_id === projectId) {
            addTaskToState(newTask);
            callbacksRef.current.onTaskInsert?.(newTask);
          }
        }

        if (eventType === 'DELETE' && oldRecord) {
          // For delete events, we can't check project_id from the transformed task
          // since the record is deleted, but we can check it from oldRecord
          if (oldRecord.project_id === projectId) {
            removeTaskFromState(oldRecord.id);
            callbacksRef.current.onTaskDelete?.(oldRecord.id);
          }
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]); // Only depend on projectId

  return { tasks, isConnected };
};

// Helper function to transform database record to Task type
const transformTaskFromDb = (dbRecord: any): Task => {
  return {
    id: dbRecord.id,
    title: dbRecord.title || '',
    description: dbRecord.description || '',
    status: dbRecord.status || 'Unassigned',
    deadline: dbRecord.deadline || new Date().toISOString(),
    owner: dbRecord.owner || null,
    collaborators: Array.isArray(dbRecord.collaborators) ? dbRecord.collaborators : [],
    parent: dbRecord.parent || null,
    project_id: dbRecord.project_id || null,
    ownerName: dbRecord.ownerName || undefined,
    ownerDepartment: dbRecord.ownerDepartment || undefined,
    priority: Number(dbRecord.priority) || 5, // Ensure priority is always a number
  };
};