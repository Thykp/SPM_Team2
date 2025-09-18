import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Task = {
  id: string;
  title: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
};

type TaskCardProps = {
  tasks: Task[];
};

export function TaskCard({ tasks }: TaskCardProps) {
  // Helper function to determine the color based on the status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Unassigned":
        return "bg-gray-100 text-gray-800"; // Gray for unassigned
      case "Ongoing":
        return "bg-blue-100 text-blue-800"; // Blue for ongoing
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"; // Yellow for under review
      case "Completed":
        return "bg-green-100 text-green-800"; // Green for completed
      case "Overdue":
        return "bg-red-100 text-red-800"; // Red for overdue
      default:
        return "bg-gray-100 text-gray-800"; // Default gray for unknown status
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`p-2 rounded ${getStatusColor(task.status)}`}
            >
              {task.title} - <span className="capitalize">{task.status}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}