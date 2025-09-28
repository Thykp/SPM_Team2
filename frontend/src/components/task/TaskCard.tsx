import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Task as taskType } from "@/lib/api"; // Import the Task component
import { Task as TaskBody } from "@/components/task/Task";
import { useMemo } from "react";

type TaskCardProps = {
  tasks: taskType[];
};

export function TaskCard({ tasks }: TaskCardProps) {
  const prioritizedTasks = useMemo(() => {
    const overdueTasks = tasks.filter(task => task.status === "Overdue");
    const otherTasks = tasks.filter(task => task.status !== "Overdue");
    return [...overdueTasks, ...otherTasks];
  }, [tasks]);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>All Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {prioritizedTasks.map((task) => (
            <li key={task.id}>
              <TaskBody
                taskContent = {task}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}