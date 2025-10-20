import { useEffect, useMemo, useState } from "react";
import {
  Profile,
  Project,
  getTaskWithParticipants,
  updateTaskParticipants,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props =
  | {
      // Default project collaborator flow
      mode?: "project";
      projectId: string;
      initialSelected?: string[];
      onSaved?: (ids: string[]) => void;
    }
  | {
      // New task participant flow
      mode: "task";
      taskId: string;
      initialSelected?: string[]; // optional seed; we’ll fetch if not given
      defaultOwnerId?: string;    // optional owner to preselect
      onSaved?: (ids: string[], ownerId: string) => void;
    };

type UserRow = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

export function CollaboratorPicker(props: Props) {
  const isTaskMode = props.mode === "task";
  const [selected, setSelected] = useState<string[]>(
    props.initialSelected ?? []
  );

  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");

  // keep ownerId but initialize AFTER isTaskMode exists
  const [ownerId, setOwnerId] = useState<string | null>(
    isTaskMode && "defaultOwnerId" in props ? props.defaultOwnerId ?? null : null
  );

  useEffect(() => {
    if (props.initialSelected) {
      setSelected(props.initialSelected);
    }
  }, [props.initialSelected]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Profile.getAllUsers()
      .then((data) => {
        if (mounted) setUsers(data as UserRow[]);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
        if (isTaskMode) {
          // If caller didn’t seed initialSelected, fetch actual participants
          if (!props.initialSelected && "taskId" in props) {
            getTaskWithParticipants(props.taskId)
              .then((t) => {
                const parts = t.participants ?? [];
                const ids = parts.map((p: any) => p.profile_id);
                setSelected(ids);
                const owner = parts.find((p: any) => p.is_owner)?.profile_id ?? null;
                setOwnerId(owner);
              })
              .catch(console.error);
          } else {
            // Seeded case: keep selected, ensure owner defaults if provided
            setOwnerId((prev) => prev ?? (("defaultOwnerId" in props && props.defaultOwnerId) || null));
          }
        }      
    return () => { mounted = false; };
  }, [isTaskMode, (props as any).taskId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.display_name, u.role, u.department].some((v) => v?.toLowerCase().includes(q))
    );
  }, [users, query]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    try {
      if (isTaskMode) {
        if (!("taskId" in props)) throw new Error("taskId is required in task mode");
        if (!ownerId) throw new Error("Please choose an owner.");
  
        // Ensure owner is in the selected set
        const finalSelected = selected.includes(ownerId) ? selected : [...selected, ownerId];
  
        // Build participants payload for atomic task service
        const participants = [
          { profile_id: ownerId, is_owner: true },
          ...finalSelected.filter((id) => id !== ownerId).map((id) => ({
            profile_id: id,
            is_owner: false,
          })),
        ];
  
        await updateTaskParticipants(props.taskId, participants);
        props.onSaved?.(finalSelected, ownerId);
        return; // don’t fall through
      }
  
      // Project (legacy) flow — keep for Story 1
      if ("projectId" in props) {
        await Project.updateCollaborators(props.projectId, selected);
        props.onSaved?.(selected);
      }
    } finally {
      setSaving(false);
    }
  }  

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isTaskMode ? "Task Participants" : "Collaborators"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search name / role / department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-64 overflow-auto border rounded p-2 space-y-2">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading &&
            filtered.map((u) => (
              <label key={u.id} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={selected.includes(u.id)}
                  // shadcn Checkbox onCheckedChange gives boolean | "indeterminate"
                  onCheckedChange={() => toggle(u.id)}
                />
                {isTaskMode && (
                  <button
                    type="button"
                    className={`ml-2 text-xs rounded px-1.5 py-0.5 border ${
                      ownerId === u.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                    onClick={() => setOwnerId(u.id)}
                    title="Set as Owner"
                  >
                    {ownerId === u.id ? "Owner" : "Make Owner"}
                  </button>
                )}
                <div className="text-sm">
                  <div className="font-medium">{u.display_name}</div>
                  <div className="text-muted-foreground">
                    {u.role} • {u.department || "—"}
                  </div>
                </div>
              </label>
            ))}
          {!loading && filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">No matches.</div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={saving || (isTaskMode && !ownerId)}>
            {saving ? "Saving…" : isTaskMode ? "Save participants" : "Save collaborators"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
