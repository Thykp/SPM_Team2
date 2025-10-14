import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Task as taskType } from "@/lib/api"; // Import the Task type
import { Task as TaskBody } from "@/components/task/Task";
import { useMemo, useState } from "react";

type TaskCardProps = {
  tasks: taskType[];
};

export function TaskCard({ tasks }: TaskCardProps) {
  const [taskList, setTaskList] = useState(tasks); // Local state for tasks

  const prioritizedTasks = useMemo(() => {
    const filteredTasks = taskList.filter((task) => task.parent == null);
    const overdueTasks = filteredTasks.filter((task) => task.status === "Overdue");
    const otherTasks = filteredTasks.filter((task) => task.status !== "Overdue");
    return [...overdueTasks, ...otherTasks];
  }, [taskList]);

  const handleTaskDeleted = (taskId: string) => {
    setTaskList((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

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
                taskContent={task}
                onTaskDeleted={handleTaskDeleted} // Pass the callback to Task
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}