"use client"

import Loader from "@/components/layout/Loader"
import { useEffect, useMemo, useState } from "react"
import { TaskBoard } from "@/components/task/TaskBoard"
import { TaskTimeline } from "@/components/task/TaskTimeline"
import { TaskCard } from "@/components/task/TaskCard"
import { useAuth } from "@/contexts/AuthContext"
import CreateTask from "@/components/task/CreateTask"
import { type Task as TaskType, Task } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Filter, Search, LayoutGrid, Calendar, Rows } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ViewType = "board" | "timeline" | "cards"

type OwnershipFilter = "mine" | "mine_and_collab"


export function Dashboard() {
  const { profile, authLoading } = useAuth()
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentView, setCurrentView] = useState<ViewType>("cards")
  const [ownerFilter, setOwnerFilter] = useState<OwnershipFilter>("mine")

  useEffect(() => {
    const fetchTasks = async () => {
      if (!profile?.id) return
      setLoading(true)
      try {
        const data = await Task.getTasksByUserId(profile.id)
        setTasks(data || [])
      } catch (err) {
        console.error("Error fetching tasks:", err)
        setError("Failed to load tasks. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [profile?.id])

  const handleTaskCreated = (newTask: TaskType) => {
    setTasks((prev) => [newTask, ...prev])
  }

  const handleTaskUpdate = (updatedTask: TaskType) => {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleTaskCreate = (status: TaskType["status"]) => {
    console.log("Creating task with status:", status)
  }

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [tasks, searchTerm]
  )

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true" aria-live="polite">
        <Loader />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Task Board</h1>
          <p className="text-muted-foreground">Manage your team's tasks and projects</p>
        </div>
        <div className="flex gap-2">
          <CreateTask userId={profile?.id || ""} onTaskCreated={handleTaskCreated} />
        </div>
      </div>

      {/* Filters, Search, and View Switcher */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              // disabled={currentView === "cards"}
              // aria-disabled={currentView === "cards"}
              // title={currentView === "cards" ? "Switch to Board/Timeline to filter by ownership" : "Filter"}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ownership</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={ownerFilter}
              onValueChange={(v) => setOwnerFilter(v as OwnershipFilter)}
            >
              <DropdownMenuRadioItem value="mine">
                My tasks
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mine_and_collab">
                My + collaborators
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>


        {/* View Switcher Buttons */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("cards")}
            className={cn("gap-2", currentView === "cards" ? "bg-slate-100" : "bg-transparent")}
          >
            <Rows className="h-4 w-4" />
            Cards
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("board")}
            className={cn("gap-2", currentView === "board" ? "bg-slate-100" : "bg-transparent")}
          >
            <LayoutGrid className="h-4 w-4" />
            Board
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("timeline")}
            className={cn("gap-2", currentView === "timeline" ? "bg-slate-100" : "bg-transparent")}
          >
            <Calendar className="h-4 w-4" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Conditionally Render View */}
      <div className="flex-1 overflow-hidden">

        {currentView === "cards" && (
          <div className="h-full overflow-auto">
            <TaskCard tasks={filteredTasks} />
          </div>
        )}

        {currentView === "board" && (
          <TaskBoard
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskCreate={handleTaskCreate}
          />
        )}

        {currentView === "timeline" && (
          <TaskTimeline tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} onTaskDelete={handleTaskDelete} />
        )}

      </div>
    </div>
  )
}
