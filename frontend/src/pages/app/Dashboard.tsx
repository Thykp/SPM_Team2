import { CollaboratorPicker } from "@/components/CollaboratorPicker";
import { useEffect, useState } from "react";
import { TaskCard } from "@/components/task/TaskCard";
import { useAuth } from "@/contexts/AuthContext";
import CreateTask from "@/components/task/CreateTask";
import { Task as TaskType, Task } from "@/lib/api"; // Import Task type and service

export function Dashboard() {
  const { profile, authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskType[]>([]); // Use the imported Task type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const data = await Task.getTasksByUserId(profile.id);
        setTasks(data || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [profile?.id]); // Refetch tasks when the profile ID changes

  const handleTaskCreated = (newTask: TaskType) => {
    setTasks((prev) => [newTask, ...prev]); // Add the new task to the top of the list
  };

  if (authLoading || loading) {
    return <p>Loading tasks...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome to your dashboard!</p>

        <TaskCard tasks={tasks} />

        {/* Create New Task Button */}
        <div className="mt-8">
          <CreateTask userId={profile?.id || ""}  onTaskCreated={handleTaskCreated} />
        </div>
      </div>
      <div className="mt-8">
        <CollaboratorPicker
          projectId="42b46a00-891f-42c2-80d8-2c7c4b519b2f"
          onSaved={(ids) => console.log("Saved collaborator IDs:", ids)}
        />
      </div>
    </>
  );
}