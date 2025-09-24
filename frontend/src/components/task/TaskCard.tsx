import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Task } from "./Task"; // Import the Task component

type Task = {
  id: string;
  title: string;
  description: string; // Add description field
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
};

type TaskCardProps = {
  tasks: Task[];
};

export function TaskCard({ tasks }: TaskCardProps) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>All Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id}>
              <Task
                id={task.id} // Pass the task ID
                title={task.title}
                description={task.description}
                status={task.status}
                onTaskUpdated={(updatedTask) => {
                  // Handle task update logic here
                  console.log("Task updated:", updatedTask);
                }}
                onDelete={() => {
                  // Handle task deletion logic here
                  console.log("Task deleted:", task.id);
                }}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}