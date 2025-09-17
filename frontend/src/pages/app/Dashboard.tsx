import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CollaboratorPicker } from "@/components/CollaboratorPicker";

export function Dashboard() {
  const tasks = [
    { id: 1, title: "Complete project report", completed: false },
    { id: 2, title: "Review pull requests", completed: true },
    { id: 3, title: "Prepare for team meeting", completed: false },
  ];

  return (
    <>
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Welcome to your dashboard!</p>

      Task Card
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`p-2 rounded ${
                  task.completed ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {task.title}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
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
