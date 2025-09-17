import { useEffect, useState } from "react";
import { TaskCard } from "@/components/task/TaskCard";
import { useAuth } from "@/contexts/AuthContext";

type Task = {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
};

export function Dashboard() {
  const { profile, authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  // const address = "http://localhost:3031/task";
  // const port = "3031";

  // Fetch tasks for the logged-in user
  useEffect(() => {
    const fetchTasks = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3031/task/${profile.id}`);
        // 8091/api/task/${profile.id}
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data = await response.json();
        setTasks(data || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [profile?.id]); // Refetch tasks when the profile ID changes

  if (authLoading || loading) {
    return <p>Loading tasks...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Welcome, {profile?.display_name || "User"}!
      </p>

      {/* Pass tasks as props to TaskCard */}
      <TaskCard tasks={tasks} />
    </div>
  );
}