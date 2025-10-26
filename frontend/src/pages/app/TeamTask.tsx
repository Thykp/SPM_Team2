import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Profile, TaskApi as TaskAPI } from "@/lib/api";
import type { TaskDTO as TaskType } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/layout/Loader";
import { cn } from "@/lib/utils";
import { TaskDetailNavigator } from "@/components/task/TaskDetailNavigator";

type CacheEntry<T> = { ts: number; data: T };
const CACHE_TTL_USERS_MS = 5 * 60 * 1000;
const CACHE_TTL_PCT_MS   = 2 * 60 * 1000;

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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

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
    case "Completed": return 100;
    case "Under Review": return 80;
    case "Ongoing": return 50;
    case "Overdue": return 30;
    case "Unassigned": return 10;
    default: return 30;
  }
}

function isTeammate(myTeamId?: string | null, meId?: string, u?: UserRow) {
  if (!u || !meId || !myTeamId) return false;
  if (u.id === meId) return false;
  return u.team_id === myTeamId;
}

export default function TeamTask() {
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tasks, setTasks] = useState<TaskType[] | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskType | null>(null);

  const [perUserPct, setPerUserPct] = useState<Record<string, number>>({});

  const myUserId = (profile as any)?.id as string | undefined;

  const [banner, setBanner] = useState<{ type: "info" | "error"; msg: string } | null>(null);

  const USERS_CACHE_KEY = "teamTask:users:all";
  const PCT_CACHE_KEY   = myUserId ? `teamTask:pct:${myUserId}` : "teamTask:pct:anon";

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
        const me = myUserId ? all.find(u => u.id === myUserId) : undefined;

        const teammates = all.filter(u => isTeammate(me?.team_id ?? null, myUserId, u));
        setUsers(teammates);
        setLoading(false);
      }

      try {
        const freshAll = await Profile.getAllUsers() as unknown as UserRow[];
        setCache(USERS_CACHE_KEY, freshAll);

        const meFresh = myUserId ? freshAll.find(u => u.id === myUserId) : undefined;

        const teammatesFresh = freshAll.filter(u => isTeammate(meFresh?.team_id ?? null, myUserId, u));
        setUsers(teammatesFresh);

        void prefetchPct(teammatesFresh);
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

  }, [myUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      [
        u.display_name,
        u.role ?? "",
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

  const prefetchPct = async (list: UserRow[]) => {
    if (!list || list.length === 0) return;

    const cachedPct = getCache<Record<string, number>>(PCT_CACHE_KEY);
    const basePct = (cachedPct?.data && isFresh(cachedPct, CACHE_TTL_PCT_MS)) ? cachedPct.data : {};
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
          const done = ts.filter(t => statusToProgress(t.status) >= 100).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          nextPct[u.id] = pct;
          setPerUserPct(prev => ({ ...prev, [u.id]: pct }));
        } catch {
          nextPct[u.id] = nextPct[u.id] ?? 0;
        }
      }
      setCache(PCT_CACHE_KEY, nextPct);
    } catch {
      setBanner(prev => prev ?? { type: "info", msg: "Some progress data is cached due to rate limits." });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Team Tasks</h1>
      <p className="text-muted-foreground mb-6">
        View your teammates, their workloads, and task progress.
      </p>

      <div className="mb-4 space-y-3">
        {banner && (
          <div
            className={cn(
              "rounded-md border p-3 text-sm",
              banner.type === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20"
                : "border-border bg-muted/30 text-foreground"
            )}
            role="status"
            aria-live="polite"
          >
            <span>{banner.msg}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1" />

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
        <p className="text-muted-foreground">No teammates found.</p>
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

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {selected ? `Tasks · ${selected.display_name}` : "Tasks"}
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-1">Click a task to view details</p>
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
                        : "bg-card"
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

