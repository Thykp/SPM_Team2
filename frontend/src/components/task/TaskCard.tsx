import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task as apiTask } from "@/lib/api"; // Import the Task component
import { Task as TaskBody } from "@/components/task/Task";

type TaskCardProps = {
  tasks: apiTask[];
  role: "Staff" | "Manager" | "Director" | "Senior Management";
};

export function TaskCard({ tasks, role }: TaskCardProps) {
  return (
    <Card className="max-w-md max-h-[500px] gap-0">
      <CardHeader >
        <CardTitle className="text-xl font-bold m-0">All Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-row gap-4">
          {/* Scrollable Task List */}
          <ScrollArea className="h-[400px]">
            <ul className="space-y-4 p-4">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskBody
                    taskContent={task}
                    role={role}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}