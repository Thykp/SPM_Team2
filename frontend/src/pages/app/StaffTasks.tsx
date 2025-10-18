import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStaffByScope, fetchTasksByUsers } from "@/lib/api";
import Loader from "@/components/layout/Loader";
import type { TaskRow, Staff } from "@/lib/api";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // who am I
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error("Not signed in");

        // look up my scope (revamped_profiles)
        const { data: me, error: pErr } = await supabase
          .from("revamped_profiles")
          .select("team_id, department_id")
          .eq("id", userId)
          .single();
        if (pErr) throw new Error(pErr.message);
        setMyTeam(me?.team_id ?? null);
        setMyDepartment(me?.department_id ?? null);

        // Pull staff under my team if present; else by department (role defaults to 'staff')
        const staffList = await fetchStaffByScope({
          team_id: me?.team_id ?? undefined,
          department_id: me?.team_id ? undefined : me?.department_id,
          role: "Staff",
        });
        setStaff(staffList);

        const ids = staffList.map((u) => u.id);
        if (ids.length === 0) {
          setTasks([]);
          return;
        }

        // GET all tasks for these users (via join table)
        const rows = await fetchTasksByUsers(ids);
        setTasks(rows);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  if (loading) return       
    <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true" aria-live="polite">
      <Loader />
    </div>;
  if (err) return <div className="p-6 text-red-600">Failed to load: {err}</div>;

  return (
    <div className="space-y-6 p-1">
      <h1 className="text-3xl font-bold">Staff Tasks</h1>
      <p className="text-muted-foreground space-x-4">
        {myTeam && <span>Team: <span className="font-medium">{myTeam}</span></span>}
        {!myTeam && myDepartment && <span>Department: <span className="font-medium">{myDepartment}</span></span>}
      </p>

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
