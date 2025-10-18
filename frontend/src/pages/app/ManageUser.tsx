import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Profile, TaskApi as TaskAPI, Report } from "@/lib/api";
import type { TaskDTO as TaskType } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/layout/Loader";
import { cn } from "@/lib/utils";
import { Users, Building2, FileDown } from "lucide-react";

// Inline user type as returned by /profile/user/all
type UserRow = {
  id: string;
  display_name: string;
  role: string | null;
  email?: string | null;
  department_id: string | null;
  team_id: string | null;
  // Optional friendly fields if your gateway ever adds them:
  department?: string | null;
  team?: string | null;
};

// --- helpers ---
function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 rounded bg-muted">
      <div className="h-2 rounded bg-primary transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  );
}

// Map your task statuses to a progress %
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

// Role gates for actions
const isManagerOrAbove = (role?: string | null) =>
  role === "Manager" || role === "Director" || role === "Senior Management";

const isDirectorOrAbove = (role?: string | null) =>
  role === "Director" || role === "Senior Management";

// date helpers
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

/**
 * Determine if user `u` should be visible under the current user's scope.
 * - Director: everyone except other Directors.
 * - Manager:  Staff in the SAME TEAM (ID-based check).
 * - Staff:    nobody.
 */
function isReportForMe(
  myRole?: string | null,
  myTeamId?: string | null,
  meId?: string,
  u?: UserRow
) {
  if (!u || !meId) return false;
  if (u.id === meId) return false;

  if (myRole === "Director" || myRole === "Senior Management") {
    return u.role !== "Director" && u.role !== "Senior Management";
  }

  if (myRole === "Manager") {
    // Team-based visibility: show Staff in my team
    if (!myTeamId) return false;
    return u.role === "Staff" && u.team_id === myTeamId;
  }

  return false;
}

export default function ManageUser() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tasks, setTasks] = useState<TaskType[] | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [perUserPct, setPerUserPct] = useState<Record<string, number>>({});

  // report date range (default last 30 days)
  const defaultRange = last30Days();
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);

  const myUserId = (profile as any)?.id as string | undefined;
  const myRole = (profile?.role as string | undefined) ?? undefined;

  const [reportBusy, setReportBusy] = useState<"team" | "department" | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const all = (await Profile.getAllUsers()) as UserRow[];

        // Find the current user in the directory to obtain canonical IDs
        const myself = myUserId ? all.find(u => u.id === myUserId) : undefined;

        // Compute who reports to me using ID-based rules
        const mine = all.filter(u =>
          isReportForMe(myRole, myself?.team_id ?? null, myUserId, u)
        );
        setUsers(mine);

        // Prefetch per-user progress for the grid
        const entries = await Promise.all(
          mine.map(async (u) => {
            try {
              const ts = await TaskAPI.getTasksByUserId(u.id);
              const total = ts.length;
              const done = ts.filter(t => statusToProgress(t.status) >= 100).length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return [u.id, pct] as const;
            } catch {
              return [u.id, 0] as const;
            }
          })
        );
        setPerUserPct(Object.fromEntries(entries));
      } catch (e) {
        console.error(e);
        setError("Failed to load your team. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [myUserId, myRole]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      [
        u.display_name,
        u.role ?? "",
        // try to search by friendly fields if present
        u.department ?? "",
        u.team ?? "",
      ].some(v => v.toLowerCase().includes(q))
    );
  }, [users, query]);

  async function openUser(u: UserRow) {
    setSelected(u);
    setDrawerOpen(true);
    setTasks(null);
    setTasksLoading(true);
    try {
      const data = await TaskAPI.getTasksByUserId(u.id);
      setTasks(data || []);
    } catch (e) {
      console.error(e);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  // Both actions hit the same report endpoint; backend decides scope by role
  async function callReport(kind: "team" | "department") {
    if (!myUserId) return;
    if (reportBusy) return;
    setBanner(null);
    setReportBusy(kind);
    try {
      const res = await Report.generate(myUserId, { startDate, endDate });
      setBanner({ type: "success", msg: res?.message || "Report requested successfully." });
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Failed to generate report." });
    } finally {
      setReportBusy(null);
    }
  }

  const dateInvalid = !startDate || !endDate || new Date(startDate) > new Date(endDate);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
      <p className="text-muted-foreground mb-6">
        View your reports, their workloads, and task progress.
      </p>

      {/* Top actions */}
      <div className="mb-4 space-y-3">
        {banner && (
          <div
            className={cn(
              "rounded-md border p-3 text-sm",
              banner.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20"
                : "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20"
            )}
            role="status"
          >
            {banner.msg}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Date range */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Start date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="End date"
            />
          </div>

          {/* Subtle, outlined button group */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="inline-flex overflow-hidden rounded-lg border border-border shadow-sm bg-card">
              {isManagerOrAbove(myRole) && (
                <Button
                  onClick={() => callReport("team")}
                  disabled={reportBusy !== null || !myUserId || dateInvalid}
                  title={!myUserId ? "Missing user id" : dateInvalid ? "Invalid date range" : "Generate team-level report"}
                  variant="outline"
                  className={cn(
                    "gap-2 rounded-none px-3 sm:px-4",
                    "hover:bg-muted",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Team Report</span>
                  <span className="sm:hidden">Team</span>
                </Button>
              )}

              {isDirectorOrAbove(myRole) && (
                <Button
                  onClick={() => callReport("department")}
                  disabled={reportBusy !== null || !myUserId || dateInvalid}
                  title={!myUserId ? "Missing user id" : dateInvalid ? "Invalid date range" : "Generate department-level report"}
                  variant="outline"
                  className={cn(
                    "gap-2 rounded-none px-3 sm:px-4",
                    isManagerOrAbove(myRole) ? "border-l border-border" : "",
                    "hover:bg-muted",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Department Report</span>
                  <span className="sm:hidden">Dept</span>
                </Button>
              )}
            </div>

            {/* Quiet caption with chosen dates */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileDown className="h-3.5 w-3.5" />
              <span>
                Range: <span className="font-medium">{startDate}</span> → <span className="font-medium">{endDate}</span>
              </span>
              {isManagerOrAbove(myRole) && !isDirectorOrAbove(myRole) && (
                <Badge variant="outline" className="h-5 text-xs">Team</Badge>
              )}
              {isDirectorOrAbove(myRole) && (
                <Badge variant="outline" className="h-5 text-xs">Department</Badge>
              )}
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name, role, department/team…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <Separator />
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
            const pct = perUserPct[u.id] ?? 0;
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
                      {(u.role ?? "Staff")} · {u.team ?? u.team_id ?? "—"}
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
            );
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
