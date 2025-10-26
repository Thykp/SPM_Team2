import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { type TaskDTO, TaskApi } from '@/lib/api';

interface UseRealtimeTasksProps {
  projectId: string;
  initialTasks: TaskDTO[];
  onTaskUpdate?: (updatedTask: TaskDTO) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskInsert?: (newTask: TaskDTO) => void;
}

export const useRealtimeTasks = ({
  projectId,
  initialTasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskInsert,
}: UseRealtimeTasksProps) => {
  const [tasks, setTasks] = useState<TaskDTO[]>(initialTasks);
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
    const updateTaskInState = (updatedTask: TaskDTO) => {
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

    const addTaskToState = (newTask: TaskDTO) => {
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'revamped_task_participant',
      }, async (payload) => {
        const { new: newRecord, old: oldRecord } = payload;
        
        // Get task_id from either new or old record
        const taskId = (newRecord as any)?.task_id || (oldRecord as any)?.task_id;
        
        if (taskId) {
          try {
            // Re-fetch the task with updated participants using the API client
            const enrichedTask = await TaskApi.getTaskByIdWithOwner(taskId);
            
            // Update the task in state
            setTasks(prev => {
              const task = prev.find(t => t.id === taskId);
              if (!task || task.project_id !== projectId) {
                return prev;
              }
              
              const index = prev.findIndex(t => t.id === taskId);
              if (index === -1) {
                return prev;
              }
              
              const updated = [...prev];
              updated[index] = {
                ...enrichedTask,
                parent: updated[index].parent,
              };
              
              return updated;
            });
            
            // Call the update callback
            callbacksRef.current.onTaskUpdate?.(enrichedTask);
          } catch (err) {
            console.error('[useRealtimeTasks] Failed to re-fetch task after participant change:', err);
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
const transformTaskFromDb = (dbRecord: any): TaskDTO => {
  return {
    id: dbRecord.id,
    title: dbRecord.title || '',
    description: dbRecord.description || '',
    status: dbRecord.status || 'Unassigned',
    deadline: dbRecord.deadline || new Date().toISOString(),
    owner: dbRecord.owner || null,
    collaborators: Array.isArray(dbRecord.collaborators) ? dbRecord.collaborators : [],
    parent: dbRecord.parent ?? dbRecord.parent_task_id ?? null,
    project_id: dbRecord.project_id || null,
    ownerName: dbRecord.ownerName || undefined,
    ownerDepartment: dbRecord.ownerDepartment || undefined,
    priority: Number(dbRecord.priority) || 5, // Ensure priority is always a number
  };
};