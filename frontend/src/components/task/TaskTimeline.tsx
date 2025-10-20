"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskDTO } from "@/lib/api"

type TaskTimelineProps = {
  tasks: TaskDTO[]
  onTaskUpdate?: (task: TaskDTO) => void
  onTaskDelete?: (taskId: string) => void
}

const getStatusBadgeColor = (status: TaskDTO["status"]) => {
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

function TimelineTaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: TaskDTO
  onUpdate?: (task: TaskDTO) => void
  onDelete?: (taskId: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
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

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {task.owner && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-600">{task.owner}</span>
              </div>
            )}
            {task.collaborators && task.collaborators.length > 0 && (
              <span className="text-xs text-slate-500">+{task.collaborators.length}</span>
            )}
          </div>

          {task.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-600">
                {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          )}
        </div>

        <Badge variant="secondary" className={cn("text-xs", getStatusBadgeColor(task.status))}>
          {task.status}
        </Badge>
      </CardContent>
    </Card>
  )
}

export function TaskTimeline({ tasks, onTaskUpdate, onTaskDelete }: TaskTimelineProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // Generate weeks for the timeline
  const generateWeeks = () => {
    const weeks = []
    const today = new Date()

    for (let i = -2; i <= 4; i++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (i + currentWeekOffset) * 7)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      })
    }

    return weeks
  }

  const weeks = generateWeeks()

  // Group tasks by week based on deadline
  const getTasksForWeek = (weekStart: Date, weekEnd: Date) => {
    return tasks.filter((task) => {
      if (!task.deadline) return false
      const taskDate = new Date(task.deadline)
      return taskDate >= weekStart && taskDate <= weekEnd
    })
  }

  const tasksWithoutDeadline = tasks.filter((task) => !task.deadline)

  return (
    <div className="h-full flex flex-col">
      {/* Timeline Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(0)}
            disabled={currentWeekOffset === 0}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {weeks.map((week, index) => {
            const weekTasks = getTasksForWeek(week.start, week.end)
            const isCurrentWeek = currentWeekOffset === 0 && index === 2

            return (
              <div key={index} className="flex-shrink-0 w-64">
                <div
                  className={cn(
                    "mb-3 p-2 rounded-lg border-2",
                    isCurrentWeek ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200",
                  )}
                >
                  <div className="text-xs font-semibold text-slate-700 mb-1">{week.label}</div>
                  <div className="text-xs text-slate-500">
                    {weekTasks.length} task{weekTasks.length !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {weekTasks.map((task) => (
                    <TimelineTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} onDelete={onTaskDelete} />
                  ))}
                  {weekTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                      <p className="text-xs">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Unscheduled Tasks Column */}
          {tasksWithoutDeadline.length > 0 && (
            <div className="flex-shrink-0 w-64">
              <div className="mb-3 p-2 rounded-lg border-2 bg-slate-50 border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-1">Unscheduled</div>
                <div className="text-xs text-slate-500">
                  {tasksWithoutDeadline.length} task{tasksWithoutDeadline.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {tasksWithoutDeadline.map((task) => (
                  <TimelineTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} onDelete={onTaskDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
