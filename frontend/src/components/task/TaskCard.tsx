import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Task as apiTask } from "@/lib/api"; // Import the Task component
import { Task as TaskBody } from "@/components/task/Task";

type TaskCardProps = {
  tasks: apiTask[];
  role: "Staff" | "Manager" | "Director" | "Senior Management";
};

export function TaskCard({ tasks, role }: TaskCardProps) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>All Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskBody
                // id={task.id} // Pass the task ID
                // title={task.title}
                // description={task.description}
                // status={task.status}
                taskContent = {task}
                role={role}
                // onTaskUpdated={(updatedTask) => {
                //   console.log("Task updated:", updatedTask);
                // }}
                // onDelete={() => {
                //   console.log("Task deleted:", task.id);
                // }}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}