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
    
    const channel = supabase
      .channel(`project-${projectId}-tasks`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task',
      }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'UPDATE' && newRecord) {
          const updatedTask = transformTaskFromDb(newRecord);
          updateTaskInState(updatedTask);
          callbacksRef.current.onTaskUpdate?.(updatedTask);
        }

        if (eventType === 'INSERT' && newRecord) {
          const newTask = transformTaskFromDb(newRecord);
          callbacksRef.current.onTaskInsert?.(newTask);
        }

        if (eventType === 'DELETE' && oldRecord) {
          removeTaskFromState(oldRecord.id);
          callbacksRef.current.onTaskDelete?.(oldRecord.id);
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
    title: dbRecord.title,
    description: dbRecord.description || '',
    status: dbRecord.status,
    deadline: dbRecord.deadline,
    owner: dbRecord.owner,
    collaborators: dbRecord.collaborators || [],
    parent: dbRecord.parent,
  };
};