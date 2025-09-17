import { useEffect, useMemo, useState } from "react";
import { fetchAllUsers, putProjectCollaborators, type LiteUser } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  projectId: string;
  initialSelected?: string[];
  onSaved?: (ids: string[]) => void;
};

export function CollaboratorPicker({ projectId, initialSelected = [], onSaved }: Props) {
  const [users, setUsers] = useState<LiteUser[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAllUsers()
      .then((data) => { if (mounted) setUsers(data); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      [u.display_name, u.role, u.department].some(v => v?.toLowerCase().includes(q))
    );
  }, [users, query]);

  function toggle(id: string) {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    try {
      await putProjectCollaborators(projectId, selected);
      onSaved?.(selected);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader><CardTitle>Collaborators</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search name / role / department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-64 overflow-auto border rounded p-2 space-y-2">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && filtered.map(u => (
            <label key={u.id} className="flex items-center gap-3 cursor-pointer">
              <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
              <div className="text-sm">
                <div className="font-medium">{u.display_name}</div>
                <div className="text-muted-foreground">{u.role} • {u.department}</div>
              </div>
            </label>
          ))}
          {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground">No matches.</div>}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save collaborators"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
