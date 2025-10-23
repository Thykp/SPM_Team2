"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Report, type ReportRecord } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Loader from "@/components/layout/Loader";
import { FileText, Download, Trash2, Calendar, Building2, Users, ExternalLink } from "lucide-react";

type Kind = "personal" | "team" | "department" | "project" | "unknown";

type Derived = {
  kind: Kind;
  start?: string;
  end?: string;
};

function deriveFromTitle(title: string): Derived {
  const between = title.match(/between (\d{4}-\d{2}-\d{2}) and (\d{4}-\d{2}-\d{2})/i);
  if (/^team report:/i.test(title)) return { kind: "team" };
  if (/^department report:/i.test(title)) return { kind: "department" };
  if (/^project report:/i.test(title)) return { kind: "project" };
  if (/personal report/i.test(title) && between) {
    return { kind: "personal", start: between[1], end: between[2] };
  }
  return { kind: "unknown", start: between?.[1], end: between?.[2] };
}

function kindIcon(kind: Derived["kind"]) {
  if (kind === "team") return <Users className="h-4 w-4" />;
  if (kind === "department") return <Building2 className="h-4 w-4" />;
  if (kind === "project") return <FileText className="h-4 w-4" />;
  if (kind === "personal") return <FileText className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeFilename(r: ReportRecord) {
  const safeTitle = r.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const day = new Date(r.created_at).toISOString().slice(0, 10);
  return `${safeTitle || "report"}-${day}.pdf`;
}

async function downloadReport(r: ReportRecord) {
  try {
    const res = await fetch(r.filepath, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFilename(r);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alert(`Failed to download: ${err?.message || "unknown error"}`);
  }
}

export function Reports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // NEW: filter state (empty => “All” kinds)
  const [activeKinds, setActiveKinds] = useState<Kind[]>([]);

  const myUserId = (profile as any)?.id as string | undefined;

  useEffect(() => {
    if (!myUserId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await Report.getByUser(myUserId);
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setReports(sorted);
      } catch (e: any) {
        setError(e?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [myUserId]);

  const handleView = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Delete this report?")) return;
    setDeletingId(reportId);
    try {
      await Report.delete(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (e: any) {
      alert(e?.message || "Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  };

  // Derived kind for each report (memoized)
  const withDerived = useMemo(
    () =>
      reports.map(r => ({
        record: r,
        derived: deriveFromTitle(r.title),
      })),
    [reports]
  );

  // Apply text + kind filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return withDerived.filter(({ record: r, derived: d }) => {
      // Kind filter: if none selected => show all
      const kindMatch = activeKinds.length === 0 || activeKinds.includes(d.kind);

      // Text filter
      if (!q) return kindMatch;

      const inTitle = r.title.toLowerCase().includes(q);
      const inDates =
        (d.start && d.start.includes(q)) ||
        (d.end && d.end.includes(q)) ||
        formatDate(r.created_at).toLowerCase().includes(q);

      return kindMatch && (inTitle || !!inDates);
    });
  }, [withDerived, query, activeKinds]);

  // Filter UI helpers
  const toggleKind = (k: Kind) => {
    setActiveKinds(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
    );
  };
  const clearKinds = () => setActiveKinds([]);

  const KIND_ORDER: Kind[] = ["personal", "team", "department", "project"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">View and download all reports you've generated.</p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Search by title or date…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />

        <div className="flex-1" />

        {/* Kind Filter Group */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeKinds.length === 0 ? "default" : "outline"}
            className="h-8"
            onClick={clearKinds}
            title="Show all report types"
          >
            All
          </Button>
          {KIND_ORDER.map((k) => {
            const active = activeKinds.includes(k);
            const label =
              k === "personal" ? "Personal" :
              k === "team" ? "Team" :
              k === "department" ? "Department" :
              k === "project" ? "Project" : "Unknown";
            return (
              <Button
                key={k}
                type="button"
                variant={active ? "default" : "outline"}
                className="h-8"
                onClick={() => toggleKind(k)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]" aria-busy="true" aria-live="polite">
          <Loader />
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-900 dark:bg-red-950/20">{error}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {query || activeKinds.length
                ? "No reports match your filters."
                : "No reports generated yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ record: r, derived: d }) => {
            const isReady = true;
            const statusBadge = isReady ? (
              <Badge variant="default" className="bg-emerald-500">Ready</Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            );

            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {kindIcon(d.kind)}
                      <CardTitle className="text-base">{r.title}</CardTitle>
                    </div>
                    {statusBadge}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Range (if we could parse it) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Date Range</span>
                    </div>
                    <p className="text-sm font-medium">
                      {d.start ? formatDate(d.start) : "—"} → {d.end ? formatDate(d.end) : "—"}
                    </p>
                  </div>

                  {/* Generated At */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Generated on {formatDateTime(r.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 gap-2" onClick={() => handleView(r.filepath)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => downloadReport(r)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive bg-transparent"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === r.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
