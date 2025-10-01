"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, User, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task as ApiTask } from "@/lib/api"

type TaskBoardProps = {
  tasks: ApiTask[]
  onTaskUpdate?: (task: ApiTask) => void
  onTaskDelete?: (taskId: string) => void
  onTaskCreate?: (status: ApiTask["status"]) => void
}

const statusColumns: Array<{
  status: ApiTask["status"]
  title: string
  color: string
  headerColor: string
}> = [
  { status: "Unassigned", title: "Backlog", color: "bg-slate-50 border-slate-200", headerColor: "text-slate-700" },
  { status: "Ongoing", title: "In Progress", color: "bg-blue-50 border-blue-200", headerColor: "text-blue-700" },
  { status: "Under Review", title: "Review", color: "bg-amber-50 border-amber-200", headerColor: "text-amber-700" },
  { status: "Completed", title: "Done", color: "bg-emerald-50 border-emerald-200", headerColor: "text-emerald-700" },
  // Optional: include Overdue so those tasks appear
  { status: "Overdue", title: "Overdue", color: "bg-red-50 border-red-200", headerColor: "text-red-700" },
]

const getStatusBadgeColor = (status: ApiTask["status"]) => {
  switch (status) {
    case "Unassigned":
      return "bg-slate-100 text-slate-700 hover:bg-slate-200"
    case "Ongoing":
      return "bg-blue-100 text-blue-700 hover:bg-blue-200"
    case "Under Review":
      return "bg-amber-100 text-amber-700 hover:bg-amber-200"
    case "Completed":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
    case "Overdue":
      return "bg-red-100 text-red-700 hover:bg-red-200"
    default:
      return "bg-slate-100 text-slate-700 hover:bg-slate-200"
  }
}

function TaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: ApiTask
  onUpdate?: (task: ApiTask) => void
  onDelete?: (taskId: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const ownerLabel = task.owner // userId/email; swap to display name if you pass it in later
  const deadlineLabel = task.deadline ? new Date(task.deadline).toLocaleDateString() : undefined

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm leading-tight pr-2">{task.title}</h4>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-white border rounded-md shadow-lg z-10">
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50"
                  onClick={() => {
                    onUpdate?.(task)
                    setShowMenu(false)
                  }}
                >
                  Edit
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600"
                  onClick={() => {
                    onDelete?.(task.id)
                    setShowMenu(false)
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {task.description && <p className="text-xs text-slate-600 mb-3 line-clamp-2">{task.description}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-600">{ownerLabel}</span>
          </div>

          {deadlineLabel && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-600">{deadlineLabel}</span>
            </div>
          )}
        </div>

        <Badge variant="secondary" className={cn("mt-2 text-xs", getStatusBadgeColor(task.status))}>
          {task.status}
        </Badge>
      </CardContent>
    </Card>
  )
}

export function TaskBoard({ tasks, onTaskUpdate, onTaskDelete, onTaskCreate }: TaskBoardProps) {
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
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn("text-sm font-semibold", column.headerColor)}>
                      {column.title}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {columnTasks.length}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onTaskCreate?.(column.status)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onUpdate={onTaskUpdate} onDelete={onTaskDelete} />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">No tasks</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
