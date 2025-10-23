"use client"

import Loader from "@/components/layout/Loader"
import { useEffect, useMemo, useState, useRef } from "react"
import { TaskBoard } from "@/components/task/TaskBoard"
import { TaskTimeline } from "@/components/task/TaskTimeline"
import { TaskCard } from "@/components/task/TaskCard"
import { useAuth } from "@/contexts/AuthContext"
import CreateTask from "@/components/task/CreateTask"
import { type TaskDTO as TaskType, TaskApi as Task, Project, Report } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Filter, Search, LayoutGrid, Calendar, Rows, FileDown, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react";
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

type OwnershipFilter = "all_mine" | "owner_only" | "assigned_only" | "project_peers_others"

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function last30Days(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 24 * 3600 * 1000);
  return { start: toYMD(start), end: toYMD(end) };
}

export function Dashboard() {
  const { profile, authLoading } = useAuth()
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [allTasksCache, setAllTasksCache] = useState<TaskType[] | null>(null)
  const myProjectIdsRef = useRef<Set<string>>(new Set())
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false); 

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentView, setCurrentView] = useState<ViewType>("cards")
  const [ownerFilter, setOwnerFilter] = useState<OwnershipFilter>("all_mine")
  const [loadingPeers, setLoadingPeers] = useState(false)

  const defaultRange = last30Days();
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportBanner, setReportBanner] = useState<{ type: "success" | "error" | "info"; msg: string; href?: string } | null>(null);

  // Load my tasks and my projects
  useEffect(() => {
    const run = async () => {
      if (!profile?.id) return
      setLoading(true)
      setError(null)
      try {
        const [myTasks, myProjs] = await Promise.all([
          Task.getTasksByUserId(profile.id),
          Project.getByUser(profile.id),
        ])
        setTasks(myTasks || [])
        myProjectIdsRef.current = new Set((myProjs || []).map(p => p.id))
      } catch (err) {
        console.error("Error fetching tasks/projects:", err)
        setError("Failed to load tasks or projects. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [profile?.id])

  useEffect(() => {
    const loadAllIfNeeded = async () => {
      if (ownerFilter !== "project_peers_others") return
      if (allTasksCache || !profile?.id) return
      setLoadingPeers(true)
      try {
        const everything = await Task.getAllTask()
        setAllTasksCache(everything || [])
      } catch (err) {
        console.error("Error fetching all tasks for peers view:", err)
        setError("Failed to load all tasks for peers view.")
      } finally {
        setLoadingPeers(false)
      }
    }
    loadAllIfNeeded()
  }, [ownerFilter, allTasksCache, profile?.id])

  const handleTaskCreated = (newTask: TaskType) => {
    setTasks((prev) => [newTask, ...prev]); // Add new task to tasks
    if (allTasksCache) {
      setAllTasksCache((prev) => (prev ? [newTask, ...prev] : prev)); // Update allTasksCache
    }
    setIsCreateTaskOpen(false); // Close the modal
  };

  const handleTaskUpdate = (updatedTask: TaskType) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)))
    if (allTasksCache) {
      setAllTasksCache(prev => prev ? prev.map(t => (t.id === updatedTask.id ? updatedTask : t)) : prev)
    }
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    if (allTasksCache) {
      setAllTasksCache(prev => prev ? prev.filter(t => t.id !== taskId) : prev)
    }
  }

  const handleTaskCreate = (status: TaskType["status"]) => {
    console.log("Creating task with status:", status)
  }

  async function handleGenerateReport() {
    if (!profile?.id) return;
    if (reportBusy) return;
    
    setReportBanner(null);
    setReportBusy(true);
    
    try {
      const res = await Report.generate(profile.id, { startDate, endDate });
      const href = (res as any)?.data?.reportUrl ?? (res as any)?.url;
      const title = (res as any)?.data?.reportTitle ?? (res as any)?.message;
      
      setReportBanner({
        type: href ? "success" : "info",
        msg: title || "Personal report generated successfully.",
        href,
      });
    } catch (e: any) {
      setReportBanner({ 
        type: "error", 
        msg: e?.message || "Failed to generate report." 
      });
    } finally {
      setReportBusy(false);
    }
  }

  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase()

  const meId = profile?.id || ""
  const isOwner = (t: TaskType) => norm(t.owner) === norm(meId)
  const isCollaborator = (t: TaskType) => Array.isArray(t.collaborators) && t.collaborators.map(norm).includes(norm(meId))
  const isParticipant = (t: TaskType) => isOwner(t) || isCollaborator(t)

  const dateInvalid = !startDate || !endDate || new Date(startDate) > new Date(endDate)

  const matchesSearch = (t: TaskType) => {
    const q = norm(searchTerm)
    return (
      !q ||
      norm(t.title).includes(q) ||
      norm(t.description).includes(q)
    )
  }

  // Compute the currently visible tasks based on the selected filter
  const visibleTasks = useMemo(() => {
    const inMyProjects = (t: TaskType) =>
      !!t.project_id && myProjectIdsRef.current.has(t.project_id)

    if (ownerFilter === "project_peers_others") {
      const source = allTasksCache || []
      return source.filter(t => inMyProjects(t) && !isParticipant(t)).filter(matchesSearch)
    }

    const base = tasks.filter(matchesSearch)

    switch (ownerFilter) {
      case "owner_only":
        return base.filter(isOwner)
      case "assigned_only":
        return base.filter(t => !isOwner(t) && isCollaborator(t))
      case "all_mine":
      default:
        return base
    }
  }, [ownerFilter, tasks, allTasksCache, searchTerm])

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
          {/* Open the CreateTask modal */}
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Conditionally render the CreateTask modal */}
      {isCreateTaskOpen && (
        <CreateTask
          userId={profile?.id || ""}
          onTaskCreated={handleTaskCreated}
          onClose={() => setIsCreateTaskOpen(false)} // Close the modal
        />
      )}

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
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Ownership</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={ownerFilter}
              onValueChange={(v) => setOwnerFilter(v as OwnershipFilter)}
            >
              <DropdownMenuRadioItem value="all_mine">All Tasks</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="owner_only">I’m owner</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="assigned_only">Assigned to me (not owner)</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="project_peers_others">
                Project peers (others’ tasks){loadingPeers ? " …" : ""}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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

      {/* Personal Report Generation */}
      <div className="mb-6">
        {reportBanner && (
          <div
            className={cn(
              "rounded-md border p-3 text-sm mb-4",
              reportBanner.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20"
                : reportBanner.type === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20"
                : "border-border bg-muted/30 text-foreground"
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{reportBanner.msg}</span>
              {reportBanner.href && (
                <a
                  href={reportBanner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium"
                >
                  Open report
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
          <Button
            onClick={handleGenerateReport}
            disabled={reportBusy || dateInvalid || !profile?.id}
            className="gap-2"
          >
            {reportBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                <span>Generate Report</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Conditionally Render View */}
      <div className="flex-1 overflow-hidden">
        {currentView === "cards" && (
          <div className="h-full overflow-auto">
            <TaskCard tasks={visibleTasks} />
          </div>
        )}

        {currentView === "board" && (
          <TaskBoard
            tasks={visibleTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskCreate={handleTaskCreate}
          />
        )}

        {currentView === "timeline" && (
          <TaskTimeline
            tasks={visibleTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
          />
        )}
      </div>
    </div>
  )
}
