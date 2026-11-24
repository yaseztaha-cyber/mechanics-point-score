"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SeverityPill } from "@/components/ui/pills";
import { formatDateTime, signed } from "@/lib/format";
import { Filter } from "lucide-react";

interface BehaviorRow {
  id: number;
  studentId: number;
  studentName: string;
  sessionId: number | null;
  category: string;
  severity: string;
  description: string | null;
  relatedPoints: number;
  status: string;
  createdAt: string;
}

export function BehaviorFilterTable() {
  const [rows, setRows] = useState<BehaviorRow[] | null>(null);
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");
  const [hasPoints, setHasPoints] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (severity) params.set("severity", severity);
    if (type) params.set("type", type);
    if (hasPoints) params.set("hasPoints", "true");
    if (q) params.set("q", q);
    fetch(`/api/behaviors?${params.toString()}`)
      .then((r) => r.json())
      .then(setRows);
  }, [severity, type, hasPoints, q]);

  const summary = useMemo(() => {
    if (!rows) return "";
    return `${rows.length} incident${rows.length === 1 ? "" : "s"} match current filters`;
  }, [rows]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student or description..." className="input" />
        </div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input w-auto">
          <option value="">All severities</option>
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="serious">Serious</option>
          <option value="positive">Positive</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input w-auto">
          <option value="">Positive & Negative</option>
          <option value="positive">Positive only</option>
          <option value="negative">Negative only</option>
        </select>
        <button
          onClick={() => setHasPoints((v) => !v)}
          className="btn !px-2.5 !py-1.5 text-xs"
          style={hasPoints ? { background: "var(--brand-soft)", borderColor: "var(--brand)", color: "var(--brand-strong)" } : undefined}
        >
          <Filter size={12} /> Has points
        </button>
      </div>
      <p className="mb-2 text-xs" style={{ color: "var(--text-faint)" }}>
        {summary}
      </p>

      <div className="surface overflow-hidden rounded-xl">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-faint)" }}>
                    Loading incidents...
                  </td>
                </tr>
              )}
              {rows?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-faint)" }}>
                    No incidents match these filters.
                  </td>
                </tr>
              )}
              {rows?.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs" style={{ color: "var(--text-faint)" }}>
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/students/${r.studentId}`} className="font-medium hover:underline">
                      {r.studentName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{r.category}</td>
                  <td className="px-4 py-2.5">
                    <SeverityPill severity={r.severity} />
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: r.relatedPoints > 0 ? "var(--state-present)" : r.relatedPoints < 0 ? "var(--state-absent)" : "var(--text-faint)" }}>
                    {r.relatedPoints ? signed(r.relatedPoints) : "—"}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-2.5" style={{ color: "var(--text-muted)" }}>
                    {r.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
