"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TaskDTO as ApiTask } from "@/lib/api"
import { Task as TaskBody } from "@/components/task/Task"

type TaskBoardProps = {
  tasks: ApiTask[]
  onTaskUpdate?: (task: ApiTask) => void
  onTaskDelete?: (taskId: string) => void
}

const statusColumns: Array<{
  status: ApiTask["status"]
  title: string
  color: string
  headerColor: string
}> = [
  { status: "Unassigned", title: "Backlog",    color: "bg-slate-50 border-slate-200",  headerColor: "text-slate-700" },
  { status: "Ongoing",    title: "In Progress", color: "bg-blue-50 border-blue-200",   headerColor: "text-blue-700" },
  { status: "Under Review", title: "Review",    color: "bg-amber-50 border-amber-200", headerColor: "text-amber-700" },
  { status: "Completed",  title: "Done",        color: "bg-emerald-50 border-emerald-200", headerColor: "text-emerald-700" },
  { status: "Overdue",    title: "Overdue",     color: "bg-red-50 border-red-200",     headerColor: "text-red-700" },
]

export function TaskBoard({ tasks, onTaskDelete }: TaskBoardProps) {
  const getTasksByStatus = (status: ApiTask["status"]) => tasks.filter((t) => t.status === status)

  return (
    <div className="h-full">
      <div className="flex gap-6 overflow-x-auto pb-6">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.status)

          return (
            <div key={column.status} className="flex-shrink-0 w-80">
              <Card className={cn("h-full", column.color)}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm font-semibold", column.headerColor)}>
                    {column.title}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {columnTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {columnTasks.map((task) => (
                      <li key={task.id}>
                        <TaskBody
                          taskContent={task}
                          onTaskDeleted={(id) => onTaskDelete?.(id)}
                        />
                      </li>
                    ))}
                    {columnTasks.length === 0 && (
                      <li className="text-center py-8 text-slate-400">
                        <p className="text-sm">No tasks</p>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
