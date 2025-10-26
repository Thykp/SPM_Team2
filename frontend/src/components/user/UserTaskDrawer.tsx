import { useState, useMemo } from "react";
import type { TaskDTO as TaskType } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Loader from "@/components/layout/Loader";
import { cn } from "@/lib/utils";
import { TaskDetailNavigator } from "@/components/task/TaskDetailNavigator";

type UserTaskDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; display_name: string } | null;
  tasks: TaskType[] | null;
  tasksLoading: boolean;
};

function statusToProgress(status?: TaskType["status"]): number {
  switch (status) {
    case "Completed": return 100;
    case "Under Review": return 80;
    case "Ongoing": return 50;
    case "Overdue": return 30;
    case "Unassigned": return 10;
    default: return 30;
  }
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 rounded bg-muted">
      <div className="h-2 rounded bg-primary transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  );
}

function Aggregate({ tasks }: { tasks: TaskType[] }) {
  const total = tasks.length;
  const done = tasks.filter(t => statusToProgress(t.status) >= 100).length;
  const pct = total ? (done / total) * 100 : 0;
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Overall progress</span>
        <span className="text-muted-foreground">
          {done}/{total} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar value={pct} />
      </div>
    </div>
  );
}

export function UserTaskDrawer({
  isOpen,
  onOpenChange,
  user,
  tasks,
  tasksLoading,
}: UserTaskDrawerProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [sortBy, setSortBy] = useState<"priority" | "deadline">("priority");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskType | null>(null);

  // Filter and sort tasks while preserving hierarchy
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];

    // Filter by active/completed
    const filtered = tasks.filter(t => {
      if (activeTab === "active") return t.status !== "Completed";
      return t.status === "Completed";
    });

    // Apply sorting WITHIN each hierarchical level
    const getSortValue = (task: TaskType): number => {
      switch (sortBy) {
        case "priority":
          return task.priority ?? 0;
        case "deadline":
          return new Date(task.deadline).getTime();
        default:
          return 0;
      }
    };

    // Create hierarchical structure with sorting within groups
    const taskMap = new Map<string, TaskType>();
    const childrenMap = new Map<string, TaskType[]>();

    filtered.forEach(task => {
      taskMap.set(task.id, task);
      if (task.parent) {
        const children = childrenMap.get(task.parent) || [];
        children.push(task);
        childrenMap.set(task.parent, children);
      }
    });

    // Sort children within each parent
    childrenMap.forEach((children) => {
      const compareFn = (a: TaskType, b: TaskType) => {
        const valA = getSortValue(a);
        const valB = getSortValue(b);
        
        if (sortBy === "priority") {
          return valB - valA; // Descending for priority
        }
        return valA - valB; // Ascending for others
      };
      
      children.sort(compareFn);
    });

    // Build final sorted array maintaining hierarchy
    const sorted: TaskType[] = [];
    
    const addTaskAndChildren = (task: TaskType) => {
      sorted.push(task);
      const children = childrenMap.get(task.id) || [];
      children.forEach(child => addTaskAndChildren(child));
    };

    // Sort root tasks first, then add them with their children
    const rootTasks = filtered.filter(t => !t.parent);
    rootTasks.sort((a, b) => {
      const valA = getSortValue(a);
      const valB = getSortValue(b);
      
      if (sortBy === "priority") {
        return valB - valA; // Descending for priority
      }
      return valA - valB; // Ascending for others
    });
    
    rootTasks.forEach(task => addTaskAndChildren(task));

    return sorted;
  }, [tasks, activeTab, sortBy]);

  const activeCount = tasks?.filter(t => t.status !== "Completed").length || 0;
  const completedCount = tasks?.filter(t => t.status === "Completed").length || 0;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {user ? `Tasks · ${user.display_name}` : "Tasks"}
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-1">Click a task to view details</p>
          </SheetHeader>

          {!user ? (
            <div className="py-6 text-muted-foreground">Select a user to see tasks.</div>
          ) : tasksLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader />
            </div>
          ) : tasks == null ? (
            <div className="py-6 text-muted-foreground">Loading…</div>
          ) : tasks.length === 0 ? (
            <div className="py-6 text-muted-foreground">No tasks found for this user.</div>
          ) : (
            <div className="py-4 space-y-5 overflow-y-auto">
              <Aggregate tasks={tasks} />

              {/* Sort and Filter Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-border shadow-sm bg-card">
                  <Button
                    variant={activeTab === "active" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("active")}
                    className="rounded-none"
                  >
                    Active
                    {activeCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                        {activeCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={activeTab === "completed" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("completed")}
                    className="rounded-none"
                  >
                    Completed
                    {completedCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                        {completedCount}
                      </Badge>
                    )}
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Task list */}
              <ul className="space-y-3">
                {filteredAndSortedTasks.map((t) => (
                  <li
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setDetailTask(t);
                      setDetailOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setDetailTask(t);
                        setDetailOpen(true);
                      }
                    }}
                    className={cn(
                      "rounded-md border p-3 cursor-pointer transition-colors",
                      "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                      t.status === "Completed"
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                        : t.status === "Overdue"
                        ? "bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-700"
                        : "bg-card",
                      t.parent && "ml-6"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {t.parent && <span className="text-muted-foreground">└─</span>}
                          <span>{t.title}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.status ?? "—"}
                        </div>
                      </div>
                      {t.deadline ? (
                        <div className="text-xs text-muted-foreground">
                          Due {new Date(t.deadline).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={statusToProgress(t.status)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Task detail navigator */}
      {detailTask && (
        <TaskDetailNavigator
          initialTask={detailTask}
          isOpen={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setDetailTask(null);
          }}
        />
      )}
    </>
  );
}

