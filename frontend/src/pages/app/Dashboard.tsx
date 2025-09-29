import { CollaboratorPicker } from "@/components/CollaboratorPicker";
import Loader from "@/components/layout/Loader";
import { useEffect, useState } from "react";
import { TaskCard } from "@/components/task/TaskCard";
import { useAuth } from "@/contexts/AuthContext";
import CreateTask from "@/components/task/CreateTask";
import { Task as TaskType, Task } from "@/lib/api";

export function Dashboard() {
  const { profile, authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRoleToAllowedValues = (role: string | undefined): "Staff" | "Manager" | "Director" | "Senior Management" => {
    const allowedRoles = ["Staff", "Manager", "Director", "Senior Management"];
    return allowedRoles.includes(role || "") ? (role as "Staff" | "Manager" | "Director" | "Senior Management") : "Staff";
  };

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

  useEffect(() => {
    fetchTasks();
  }, [profile?.id]);

  const handleTaskCreated = (newTask: TaskType) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true" aria-live="polite">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome to your dashboard!</p>

        <TaskCard tasks={tasks} role={mapRoleToAllowedValues(profile?.role)} />

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