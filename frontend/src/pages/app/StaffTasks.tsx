import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStaffByScope, fetchTasksByUsers } from "@/lib/api";
import Loader from "@/components/layout/Loader";
import type { TaskRow, Staff } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type CacheEntry<T> = { ts: number; data: T };

const CACHE_TTL_STAFF_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_TASKS_MS = 2 * 60 * 1000; // 2 minutes

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

type GroupedTasks = Record<string, TaskRow[]>;

function formatDue(iso: string | null | undefined) {
  if (!iso) return "No due date";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "No due date";
  }
}

export default function StaffTasks() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [myDepartment, setMyDepartment] = useState<string | null>(null);

  const [banner, setBanner] = useState<{ type: "info" | "error"; msg: string } | null>(null);

  // derive cache keys after we know the scope
  const staffKey = myTeam
    ? `staffTasks:staff:team:${myTeam}`
    : myDepartment
    ? `staffTasks:staff:dept:${myDepartment}`
    : null;

  const tasksKey = myTeam
    ? `staffTasks:tasks:team:${myTeam}`
    : myDepartment
    ? `staffTasks:tasks:dept:${myDepartment}`
    : null;

  // Initial boot: who am I & what is my scope?
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setBanner(null);

      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error("Not signed in");

        const { data: me, error: pErr } = await supabase
          .from("revamped_profiles")
          .select("team_id, department_id")
          .eq("id", userId)
          .single();
        if (pErr) throw new Error(pErr.message);

        setMyTeam(me?.team_id ?? null);
        setMyDepartment(me?.department_id ?? null);
      } catch (e: any) {
        setErr(e.message || String(e));
        setLoading(false);
      }
    })();
  }, []);

  // Once scope is known, do SWR: show cached staff/tasks if fresh; refresh in background.
  useEffect(() => {
    if (!myTeam && !myDepartment) return; // scope not ready yet
    if (!staffKey || !tasksKey) return;

    let cancelled = false;

    const loadFromCacheThenRefresh = async () => {
      setLoading(true);
      setErr(null);
      setBanner(null);

      // 1) read cached staff/tasks if available and fresh
      const staffCache = getCache<Staff[]>(staffKey);
      const tasksCache = getCache<TaskRow[]>(tasksKey);

      const haveFreshStaff = isFresh(staffCache, CACHE_TTL_STAFF_MS);
      const haveFreshTasks = isFresh(tasksCache, CACHE_TTL_TASKS_MS);

      if (haveFreshStaff) setStaff(staffCache!.data);
      if (haveFreshTasks) setTasks(tasksCache!.data);

      // show something quickly if we have any cache
      if ((haveFreshStaff || haveFreshTasks) && !cancelled) {
        setLoading(false);
      }

      // 2) background refresh: staff
      try {
        const staffList = await fetchStaffByScope({
          team_id: myTeam ?? undefined,
          department_id: myTeam ? undefined : myDepartment ?? undefined,
          role: "Staff",
        });

        if (!cancelled) {
          setStaff(staffList);
          setCache(staffKey, staffList);
        }

        // 3) background refresh: tasks (only if there are staff)
        const ids = staffList.map((u) => u.id);
        if (ids.length > 0) {
          try {
            const rows = await fetchTasksByUsers(ids);
            if (!cancelled) {
              setTasks(rows);
              setCache(tasksKey, rows);
            }
          } catch (te: any) {
            if (!cancelled) {
              if (haveFreshTasks) {
                setBanner({ type: "info", msg: "Using cached tasks due to network limits." });
              } else {
                setErr(te?.message || "Failed to load tasks.");
              }
            }
          }
        } else {
          if (!cancelled) {
            setTasks([]);
            setCache(tasksKey, []);
          }
        }
      } catch (se: any) {
        if (!cancelled) {
          if (haveFreshStaff) {
            setBanner({ type: "info", msg: "Using cached staff due to network limits." });
          } else {
            setErr(se?.message || "Failed to load staff.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadFromCacheThenRefresh();

    return () => {
      cancelled = true;
    };

  }, [myTeam, myDepartment]);

  // Group tasks by staff id (owner/collab attribution is done by backend query; we just show tasks per person)
  const grouped: GroupedTasks = useMemo(() => {
    const map: GroupedTasks = {};
    for (const s of staff) map[s.id] = [];
    for (const t of tasks) {
      const seen = new Set<string>(); // de-dupe by person-task
      if (t.owner_id) {
        (map[t.owner_id] ||= []).push(t);
        seen.add(`${t.owner_id}:${t.id}`);
      }
      if (Array.isArray(t.participants)) {
        for (const pid of t.participants) {
          const key = `${pid}:${t.id}`;
          if (seen.has(key)) continue;
          (map[pid] ||= []).push(t);
          seen.add(key);
        }
      }
    }
    // sort by deadline asc (nulls last)
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return map;
  }, [staff, tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true" aria-live="polite">
        <Loader />
      </div>
    );
  }

  if (err) {
    return <div className="p-6 text-red-600">Failed to load: {err}</div>;
  }

  return (
    <div className="space-y-6 p-1">
      <h1 className="text-3xl font-bold">Staff Tasks</h1>

      {(myTeam || myDepartment) && (
        <p className="text-muted-foreground space-x-4">
          {myTeam && (
            <span>
              Team: <span className="font-medium">{myTeam}</span>
            </span>
          )}
          {!myTeam && myDepartment && (
            <span>
              Department: <span className="font-medium">{myDepartment}</span>
            </span>
          )}
        </p>
      )}

      {banner && (
        <div
          className={cn(
            "rounded-md border p-3 text-sm",
            banner.type === "info"
              ? "border-border bg-muted/30 text-foreground"
              : "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/20"
          )}
          role="status"
        >
          {banner.msg}
        </div>
      )}

      {staff.length === 0 ? (
        <div className="text-sm text-muted-foreground">No staff found in your scope.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => {
            const list = grouped[s.id] || [];
            const displayName = s.display_name || "(no display name)";
            const role = s.role || "staff";

            return (
              <Card key={s.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {displayName}
                    <span className="ml-2 text-xs text-muted-foreground">{role}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {list.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No tasks.</div>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((t) => (
                        <li key={t.id} className="rounded border p-2">
                          <div className="font-medium">{t.title || "(untitled task)"}</div>
                          <div className="text-xs text-muted-foreground">Due: {formatDue(t.deadline)}</div>
                          {t.status && (
                            <div className="mt-1 text-xs">
                              Status: <span className="font-medium">{t.status}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
