import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Profile, TaskApi as TaskAPI } from "@/lib/api"
import type { TaskDTO as TaskType } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Loader from "@/components/layout/Loader"
import { cn } from "@/lib/utils"

// Inline user type
type UserRow = {
  id: string
  display_name: string
  role: string
  department: string
}

// --- helpers ---
function getInitials(name?: string) {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="w-full h-2 rounded bg-muted">
      <div className="h-2 rounded bg-primary transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  )
}

// Map your task statuses to a progress %
function statusToProgress(status?: TaskType["status"]): number {
  switch (status) {
    case "Completed": return 100
    case "Under Review": return 80
    case "Ongoing": return 50
    case "Overdue": return 30
    case "Unassigned": return 10
    default: return 30
  }
}

// Who is “working under me”?
// Default policy (adjust as needed):
// - Director -> everyone except other Directors
// - Manager  -> Staff in same department
// - Staff    -> no reports
function isReport(
  me: { id?: string; role?: string; department?: string },
  u: UserRow
) {
  if (!me?.id || u.id === me.id) return false
  const myRole = me.role
  if (myRole === "Director") return u.role !== "Director"
  if (myRole === "Manager") return u.role === "Staff" && (!!me.department && u.department === me.department)
  return false
}

export default function ManageUser() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [tasks, setTasks] = useState<TaskType[] | null>(null)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [perUserPct, setPerUserPct] = useState<Record<string, number>>({})

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const all = (await Profile.getAllUsers()) as UserRow[]

        // Apply “reports” logic client-side. If you later add a manager_id relation,
        // replace this with a direct server filter.
        const mine = all.filter(u =>
          isReport(
            { id: profile?.id, role: profile?.role as string | undefined },
            u
          )
        )
        setUsers(mine)

        // Prefetch per-user progress for the grid
        const entries = await Promise.all(
          mine.map(async (u) => {
            try {
              const ts = await TaskAPI.getTasksByUserId(u.id)
              const total = ts.length
              const done = ts.filter(t => statusToProgress(t.status) >= 100).length
              const pct = total ? Math.round((done / total) * 100) : 0
              return [u.id, pct] as const
            } catch {
              return [u.id, 0] as const
            }
          })
        )
        setPerUserPct(Object.fromEntries(entries))
      } catch (e) {
        console.error(e)
        setError("Failed to load your team. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [profile?.id, profile?.role])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      [u.display_name, u.role, u.department].filter(Boolean).some(v => v!.toLowerCase().includes(q))
    )
  }, [users, query])

  async function openUser(u: UserRow) {
    setSelected(u)
    setDrawerOpen(true)
    setTasks(null)
    setTasksLoading(true)
    try {
      const data = await TaskAPI.getTasksByUserId(u.id)
      setTasks(data || [])
    } catch (e) {
      console.error(e)
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
      <p className="text-muted-foreground mb-6">
        View your reports, their workloads, and task progress.
      </p>

      <div className="mb-4">
        <Input
          placeholder="Search by name, role, or department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]" aria-busy="true" aria-live="polite">
          <Loader />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No reports found.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => {
            const pct = perUserPct[u.id] ?? 0
            return (
              <Card key={u.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage alt={u.display_name} />
                    <AvatarFallback>{getInitials(u.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight">{u.display_name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {u.role || "Staff"} · {u.department || "—"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Overall progress</span>
                      <span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                  <Button size="sm" className="w-full" onClick={() => openUser(u)}>
                    View tasks
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {selected ? `Tasks · ${selected.display_name}` : "Tasks"}
            </SheetTitle>
          </SheetHeader>

          {!selected ? (
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

              <ul className="space-y-3">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "rounded-md border p-3",
                      t.status === "Completed" ? "bg-emerald-50/40 dark:bg-emerald-950/20" : "bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.status ?? "—"}
                          {t.parent ? ` · Subtask of ${t.parent}` : null}
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
    </div>
  )
}

function Aggregate({ tasks }: { tasks: TaskType[] }) {
  const total = tasks.length
  const done = tasks.filter(t => statusToProgress(t.status) >= 100).length
  const pct = total ? (done / total) * 100 : 0
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
  )
}
