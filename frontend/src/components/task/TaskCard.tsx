import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import type { TaskDTO as taskType } from "@/lib/api";
import { Task as TaskBody } from "@/components/task/Task";
import { useMemo, useState, useEffect } from "react";

type TaskCardProps = {
  tasks: taskType[];
};

export function TaskCard({ tasks }: TaskCardProps) {
  const [taskList, setTaskList] = useState(tasks); // Local state for tasks
  const [sortBy, setSortBy] = useState<"priority" | "status" | "deadline">("priority");

  // Sync local state with prop changes (for filters/search)
  useEffect(() => {
    setTaskList(tasks);
  }, [tasks]);

  const prioritizedTasks = useMemo(() => {
    return taskList.filter((task) => task.parent == null);
  }, [taskList]);

  // Split into active and completed tasks
  const activeTasks = useMemo(() => {
    return prioritizedTasks.filter((task) => task.status !== "Completed");
  }, [prioritizedTasks]);

  const completedTasks = useMemo(() => {
    return prioritizedTasks.filter((task) => task.status === "Completed");
  }, [prioritizedTasks]);

  // Sort active tasks based on selected sort option
  const sortedActiveTasks = useMemo(() => {
    const sorted = [...activeTasks];
    
    switch (sortBy) {
      case "priority":
        // Higher number = higher priority (10 is highest, 1 is lowest)
        return sorted.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      
      case "status": {
        const statusOrder: Record<string, number> = {
          "Overdue": 0,
          "Under Review": 1,
          "Ongoing": 2,
          "Unassigned": 3
        };
        return sorted.sort((a, b) => (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999));
      }
      
      case "deadline":
        return sorted.sort((a, b) => 
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
      
      default:
        return sorted;
    }
  }, [activeTasks, sortBy]);

  const handleTaskDeleted = (taskId: string) => {
    setTaskList((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Active Tasks Card */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Tasks</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "priority" | "status" | "deadline")}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs">
                {activeTasks.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedActiveTasks.length > 0 ? (
            <ul className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {sortedActiveTasks.map((task) => (
                <li key={task.id}>
                  <TaskBody
                    taskContent={task}
                    onTaskDeleted={handleTaskDeleted}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active tasks
            </p>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks Card */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-muted-foreground">Completed Tasks</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {completedTasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {completedTasks.length > 0 ? (
            <ul className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {completedTasks.map((task) => (
                <li key={task.id}>
                  <TaskBody
                    taskContent={task}
                    onTaskDeleted={handleTaskDeleted}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No completed tasks
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}