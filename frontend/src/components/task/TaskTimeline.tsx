"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskDTO } from "@/lib/api"
import { TaskReminder } from "./TaskReminder"
import { Task as TaskBody } from "@/components/task/Task"

type TaskTimelineProps = {
  tasks: TaskDTO[]
  onTaskUpdate?: (task: TaskDTO) => void
  onTaskDelete?: (taskId: string) => void
}

export function TaskTimeline({ tasks, onTaskDelete }: TaskTimelineProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  const generateWeeks = () => {
    const weeks: { start: Date; end: Date; label: string }[] = []
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

  const getTasksForWeek = (weekStart: Date, weekEnd: Date) =>
    tasks.filter((task) => {
      if (!task.deadline) return false
      const d = new Date(task.deadline)
      return d >= weekStart && d <= weekEnd
    })

  const tasksWithoutDeadline = tasks.filter((t) => !t.deadline)

  return (
    <div className="h-full flex flex-col">
      {/* Timeline Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset((v) => v - 1)}
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
            onClick={() => setCurrentWeekOffset((v) => v + 1)}
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

                <ul className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {weekTasks.map((task) => (
                    <li key={task.id}>
                      <TaskBody
                        taskContent={task}
                        onTaskDeleted={(id) => onTaskDelete?.(id)}
                      />
                    </li>
                  ))}
                  {weekTasks.length === 0 && (
                    <li className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                      <p className="text-xs">No tasks</p>
                    </li>
                  )}
                </ul>
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

              <ul className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {tasksWithoutDeadline.map((task) => (
                  <li key={task.id}>
                    <TaskBody
                      taskContent={task}
                      onTaskDeleted={(id) => onTaskDelete?.(id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
