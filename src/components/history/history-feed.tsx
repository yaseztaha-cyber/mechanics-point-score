"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime, signed } from "@/lib/format";
import { AttendancePill, SeverityPill } from "@/components/ui/pills";
import { CheckCircle2, Plus, ShieldAlert, StickyNote } from "lucide-react";

interface HistoryRow {
  kind: "attendance" | "point" | "behavior" | "note";
  id: number;
  student_id: number;
  student_name: string;
  session_id: number | null;
  detail: string;
  points: number | null;
  severity: string | null;
  note: string | null;
  ts: string;
}

const TYPES = [
  { key: "", label: "All" },
  { key: "attendance", label: "Attendance" },
  { key: "point", label: "Points" },
  { key: "behavior", label: "Behavior" },
  { key: "note", label: "Notes" },
];

export function HistoryFeed() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    params.set("page", String(page));
    fetch(`/api/history?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows);
        setTotal(data.total);
        setLoading(false);
      });
  }, [type, q, page]);

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by student name..."
          className="input max-w-xs"
        />
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setType(t.key);
                setPage(1);
              }}
              className="btn !px-2.5 !py-1.5 text-xs"
              style={type === t.key ? { background: "var(--brand-soft)", borderColor: "var(--brand)", color: "var(--brand-strong)" } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: "var(--bg-subtle)" }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>
          No activity matches your filters.
        </p>
      ) : (
        <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
          {rows.map((r) => (
            <div key={`${r.kind}-${r.id}`} className="flex items-start gap-3 px-4 py-3 text-sm">
              <div className="mt-0.5 shrink-0">
                {r.kind === "attendance" && <CheckCircle2 size={15} style={{ color: "var(--brand)" }} />}
                {r.kind === "point" && <Plus size={15} style={{ color: (r.points ?? 0) >= 0 ? "var(--state-present)" : "var(--state-absent)" }} />}
                {r.kind === "behavior" && <ShieldAlert size={15} style={{ color: "var(--sev-moderate)" }} />}
                {r.kind === "note" && <StickyNote size={15} style={{ color: "var(--brand)" }} />}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>
                    <Link href={`/students/${r.student_id}`} className="font-medium hover:underline">
                      {r.student_name}
                    </Link>{" "}
                    <span style={{ color: "var(--text-faint)" }}>
                      {r.kind === "attendance" && <>marked <AttendancePill status={r.detail} /></>}
                      {r.kind === "point" && (
                        <>
                          {signed(r.points ?? 0)} — {r.detail}
                        </>
                      )}
                      {r.kind === "behavior" && (
                        <>
                          {r.detail} <SeverityPill severity={r.severity ?? "minor"} />
                        </>
                      )}
                      {r.kind === "note" && `note added — ${r.detail}`}
                    </span>
                  </p>
                  <span className="shrink-0 text-xs" style={{ color: "var(--text-faint)" }}>
                    {formatDateTime(r.ts)}
                  </span>
                </div>
                {r.note && r.kind !== "note" && <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>{r.note}</p>}
                {r.kind === "note" && <p className="mt-0.5 text-sm">{r.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span style={{ color: "var(--text-faint)" }}>
            Page {page} of {totalPages} · {total} events
          </span>
          <div className="flex gap-1.5">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn !px-2 !py-1">
              Prev
            </button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn !px-2 !py-1">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
