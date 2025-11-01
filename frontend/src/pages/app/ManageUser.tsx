import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Profile, TaskApi as TaskAPI, Report } from "@/lib/api";
import type { TaskDTO as TaskType } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/layout/Loader";
import { cn } from "@/lib/utils";
import { Users, Building2, FileDown, Loader2, Globe2 } from "lucide-react";
import { UserTaskDrawer } from "@/components/user/UserTaskDrawer";

type CacheEntry<T> = { ts: number; data: T };
const CACHE_TTL_USERS_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_PCT_MS = 2 * 60 * 1000; // 2 minutes

function setCache<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = { ts: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

function getCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function isFresh(entry: CacheEntry<any> | null, ttl: number) {
  if (!entry) return false;
  return Date.now() - entry.ts < ttl;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

type UserRow = {
  id: string;
  display_name: string;
  role: string | null;
  email?: string | null;
  department_id: string | null;
  team_id: string | null;
  department?: string | null;
  team?: string | null;
};

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

function statusToProgress(status?: TaskType["status"]): number {
  switch (status) {
    case "Completed":
      return 100;
    case "Under Review":
      return 80;
    case "Ongoing":
      return 50;
    case "Overdue":
      return 30;
    case "Unassigned":
      return 10;
    default:
      return 30;
  }
}

/** MUTUALLY EXCLUSIVE role gates for the action buttons */
const canSeeTeamButton = (role?: string | null) => role === "Manager";
const canSeeDepartmentButton = (role?: string | null) => role === "Director";

// HR department constant used across component
const HR_DEPT_ID = "00000000-0000-0000-0000-000000000005";
const isHRDepartment = (deptId?: string | null) => deptId === HR_DEPT_ID;
/** Org button shown if Senior Management OR user belongs to HR */
const canSeeOrganisationButton = (role?: string | null, deptId?: string | null) =>
  role === "Senior Management" || isHRDepartment(deptId);

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
 * - Director (not HR): staff inside same department, excluding Directors/Senior Management.
 * - Senior Management or HR: everyone except Directors.
 * - Manager: Staff in the SAME TEAM (ID-based check).
 * - Staff:    nobody.
 */
function isReportForMe(
  myRole?: string | null,
  myTeamId?: string | null,
  myDepartmentId?: string | null,
  meId?: string,
  u?: UserRow
) {
  if (!u || !meId) return false;
  if (u.id === meId) return false;

  const isHR = isHRDepartment(myDepartmentId);

  if (myRole === "Director" && !isHR) {
    return u.role !== "Director" && u.role !== "Senior Management" && u.department_id === myDepartmentId;
  }

  if (myRole === "Senior Management" || isHR) {
    return u.role !== "Director"; // No department restriction
  }

  if (myRole === "Manager") {
    if (!myTeamId) return false;
    return u.role === "Staff" && u.team_id === myTeamId;
  }

  return false;
}

/** detect "no tasks" / 404-ish, same pattern as dashboard */
function isNotFoundError(e: any): boolean {
  const status = e?.response?.status ?? e?.status;
  const code = e?.response?.data?.code ?? e?.code;
  const msg = (e?.response?.data?.message ?? e?.message ?? "").toString();
  return (
    status === 404 ||
    code === "NOT_FOUND" ||
    code === "NO_TASKS" ||
    /404/.test(String(status)) ||
    /not\s*found/i.test(msg) ||
    /no tasks/i.test(msg)
  );
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

  // progress % per user
  const [perUserPct, setPerUserPct] = useState<Record<string, number>>({});

  // report date range (default last 30 days)
  const defaultRange = last30Days();
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);

  const myUserId = (profile as any)?.id as string | undefined;
  const myRole = (profile?.role as string | undefined) ?? undefined;

  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [myDepartmentId, setMyDepartmentId] = useState<string | null>(null);

  const [reportBusy, setReportBusy] = useState<"team" | "department" | "organisation" | null>(null);
  const [banner, setBanner] = useState<{
    type: "success" | "error" | "info";
    msg: string;
    href?: string;
    showHint?: string;
  } | null>(null);

  const USERS_CACHE_KEY = "manageUser:users:all";
  const PCT_CACHE_KEY = myUserId ? `manageUser:pct:${myUserId}` : "manageUser:pct:anon";

  function rangeLabel() {
    return `${startDate} to ${endDate}`;
  }

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      const cached = getCache<UserRow[]>(USERS_CACHE_KEY);
      let all: UserRow[] | null = null;

      if (cached?.data && isFresh(cached, CACHE_TTL_USERS_MS)) {
        all = cached.data;
      }

      if (all) {
        const me = myUserId ? all.find((u) => u.id === myUserId) : undefined;
        setMyTeamId(me?.team_id ?? null);
        setMyDepartmentId(me?.department_id ?? null);

        const mine = all.filter((u) =>
          isReportForMe(myRole, me?.team_id ?? null, me?.department_id ?? null, myUserId, u)
        );
        setUsers(mine);
        setLoading(false);
      }

      try {
        const freshAll = (await Profile.getAllUsers()) as unknown as UserRow[];
        if (freshAll.length > 0) {
          setCache(USERS_CACHE_KEY, freshAll);

          const meFresh = myUserId ? freshAll.find((u) => u.id === myUserId) : undefined;
          setMyTeamId(meFresh?.team_id ?? null);
          setMyDepartmentId(meFresh?.department_id ?? null);

          const mineFresh = freshAll.filter((u) =>
            isReportForMe(myRole, meFresh?.team_id ?? null, meFresh?.department_id ?? null, myUserId, u)
          );
          setUsers(mineFresh);

          void prefetchPct(mineFresh);
        }
      } catch (e: any) {
        if (!all) {
          setError("Failed to load your team. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    const loadPct = async () => {
      const cachedPct = getCache<Record<string, number>>(PCT_CACHE_KEY);
      if (cachedPct?.data && isFresh(cachedPct, CACHE_TTL_PCT_MS)) {
        setPerUserPct(cachedPct.data);
      }
    };

    loadPct();
    loadUsers();
  }, [myUserId, myRole]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.display_name, u.role ?? "", u.department ?? "", u.team ?? ""].some((v) => v.toLowerCase().includes(q))
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

  const prefetchPct = async (list: UserRow[]) => {
    if (!list || list.length === 0) return;

    const cachedPct = getCache<Record<string, number>>(PCT_CACHE_KEY);
    const basePct = cachedPct?.data && isFresh(cachedPct, CACHE_TTL_PCT_MS) ? cachedPct.data : {};
    if (Object.keys(basePct).length > 0) {
      setPerUserPct(basePct);
    }

    const nextPct: Record<string, number> = { ...basePct };

    try {
      for (const u of list) {
        if (basePct[u.id] !== undefined) continue;

        await sleep(100);

        try {
          const ts = await TaskAPI.getTasksByUserId(u.id);
          const total = ts.length;
          const done = ts.filter((t) => statusToProgress(t.status) >= 100).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          nextPct[u.id] = pct;
          setPerUserPct((prev) => ({ ...prev, [u.id]: pct }));
        } catch {
          nextPct[u.id] = nextPct[u.id] ?? 0;
        }
      }
      setCache(PCT_CACHE_KEY, nextPct);
    } catch {
      setBanner((prev) => prev ?? { type: "info", msg: "Some progress data is cached due to rate limits." });
    }
  };

  async function callReport(kind: "team" | "department" | "organisation") {
    if (reportBusy) return;
    setBanner(null);
    setReportBusy(kind);

    try {
      if (!myUserId) throw new Error("Your user ID is missing from the session.");

      if (kind === "team") {
        if (!canSeeTeamButton(myRole)) throw new Error("You are not allowed to generate a team report.");
        if (!myTeamId) throw new Error("Your team is not set.");

        const res = await Report.generateTeam(myTeamId, { startDate, endDate, userId: myUserId });
        const href = (res as any)?.data?.reportUrl ?? (res as any)?.url;
        const title = (res as any)?.data?.reportTitle ?? (res as any)?.message;

        setBanner({
          type: href ? "success" : "info",
          msg: title || "Team report requested successfully.",
          href,
        });
      } else if (kind === "department") {
        if (!canSeeDepartmentButton(myRole)) throw new Error("You are not allowed to generate a department report.");
        if (!myDepartmentId) throw new Error("Your department is not set.");

        const res = await Report.generateDepartment(myDepartmentId, { startDate, endDate, userId: myUserId });
        const href = (res as any)?.data?.reportUrl ?? (res as any)?.url;
        const title = (res as any)?.data?.reportTitle ?? (res as any)?.message;

        setBanner({
          type: href ? "success" : "info",
          msg: title || "Department report requested successfully.",
          href,
        });
      } else {
        // organisation
        if (!canSeeOrganisationButton(myRole, myDepartmentId)) {
          throw new Error("You are not allowed to generate an organisation report.");
        }
        const res = await Report.generateOrganisation({ startDate, endDate, userId: myUserId });
        const href = (res as any)?.data?.reportUrl ?? (res as any)?.url;
        const title = (res as any)?.data?.reportTitle ?? (res as any)?.message;

        setBanner({
          type: href ? "success" : "info",
          msg: title || "Organisation report requested successfully.",
          href,
        });
      }
    } catch (e: any) {
      // 👇 graceful handling like dashboard
      if (isNotFoundError(e)) {
        if (kind === "team") {
          setBanner({
            type: "info",
            msg: `No tasks found for your team for ${rangeLabel()}.`,
            showHint: "Ask your team members to create tasks first, then try generating the team report again.",
          });
        } else if (kind === "department") {
          setBanner({
            type: "info",
            msg: `No tasks found for your department for ${rangeLabel()}.`,
            showHint:
              "Ask your department staff to create or update tasks for this period, then try generating the department report again.",
          });
        } else {
          setBanner({
            type: "info",
            msg: `No tasks found for the organisation for ${rangeLabel()}.`,
          });
        }
      } else {
        setBanner({ type: "error", msg: e?.message || "Failed to generate report." });
      }
    } finally {
      setReportBusy(null);
    }
  }

  const dateInvalid = !startDate || !endDate || new Date(startDate) > new Date(endDate);
  const disableTeamBtn = reportBusy !== null || !myTeamId || !myUserId || dateInvalid;
  const disableDeptBtn = reportBusy !== null || !myDepartmentId || !myUserId || dateInvalid;
  const disableOrgBtn = reportBusy !== null || !myUserId || dateInvalid;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
      <p className="text-muted-foreground mb-6">View your reports, their workloads, and task progress.</p>

      {/* Top actions */}
      <div className="mb-4 space-y-3">
        {banner && (
          <div
            className={cn(
              "rounded-md border p-3 text-sm",
              banner.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20"
                : banner.type === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20"
                : "border-border bg-muted/30 text-foreground"
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{banner.msg}</span>
              {banner.href && (
                <a
                  href={banner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium"
                >
                  Open report
                </a>
              )}
            </div>
            {banner.showHint && <p className="text-xs mt-2 text-muted-foreground">{banner.showHint}</p>}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Date range */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End date" />
          </div>

          {/* Button group */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="inline-flex overflow-hidden rounded-lg border border-border shadow-sm bg-card">
              {canSeeTeamButton(myRole) && (
                <Button
                  onClick={() => callReport("team")}
                  disabled={disableTeamBtn}
                  aria-busy={reportBusy === "team"}
                  title={
                    !myUserId
                      ? "Missing user id"
                      : !myTeamId
                      ? "No team associated with your profile"
                      : dateInvalid
                      ? "Invalid date range"
                      : "Generate team-level report"
                  }
                  variant="outline"
                  className={cn(
                    "gap-2 rounded-none px-3 sm:px-4",
                    "hover:bg-muted",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {reportBusy === "team" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Users className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {reportBusy === "team" ? "Generating…" : "Team Report"}
                  </span>
                  <span className="sm:hidden">{reportBusy === "team" ? "…" : "Team"}</span>
                </Button>
              )}

              {canSeeDepartmentButton(myRole) && (
                <Button
                  onClick={() => callReport("department")}
                  disabled={disableDeptBtn}
                  aria-busy={reportBusy === "department"}
                  title={
                    !myUserId
                      ? "Missing user id"
                      : !myDepartmentId
                      ? "No department associated with your profile"
                      : dateInvalid
                      ? "Invalid date range"
                      : "Generate department-level report"
                  }
                  variant="outline"
                  className={cn(
                    "gap-2 rounded-none px-3 sm:px-4",
                    "hover:bg-muted",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {reportBusy === "department" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {reportBusy === "department" ? "Generating…" : "Department Report"}
                  </span>
                  <span className="sm:hidden">{reportBusy === "department" ? "…" : "Dept"}</span>
                </Button>
              )}

              {canSeeOrganisationButton(myRole, myDepartmentId) && (
                <Button
                  onClick={() => callReport("organisation")}
                  disabled={disableOrgBtn}
                  aria-busy={reportBusy === "organisation"}
                  title={
                    !myUserId
                      ? "Missing user id"
                      : dateInvalid
                      ? "Invalid date range"
                      : "Generate organisation-wide report"
                  }
                  variant="outline"
                  className={cn(
                    "gap-2 rounded-none px-3 sm:px-4",
                    "hover:bg-muted",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {reportBusy === "organisation" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Globe2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {reportBusy === "organisation" ? "Generating…" : "Organisation Report"}
                  </span>
                  <span className="sm:hidden">{reportBusy === "organisation" ? "…" : "Org"}</span>
                </Button>
              )}
            </div>

            {/* Quiet caption with chosen dates */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileDown className="h-3.5 w-3.5" />
              <span>
                Range: <span className="font-medium">{startDate}</span> → <span className="font-medium">{endDate}</span>
              </span>
              {canSeeTeamButton(myRole) && <Badge variant="outline">Team</Badge>}
              {canSeeDepartmentButton(myRole) && <Badge variant="outline">Department</Badge>}
              {canSeeOrganisationButton(myRole, myDepartmentId) && <Badge variant="outline">Org</Badge>}
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

      {/* User task drawer */}
      <UserTaskDrawer
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={selected}
        tasks={tasks}
        tasksLoading={tasksLoading}
      />
    </div>
  );
}
