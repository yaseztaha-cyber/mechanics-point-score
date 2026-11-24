"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, ArrowUpDown, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/providers/toast-provider";
import { pct } from "@/lib/format";

interface StudentRow {
  id: number;
  studentCode: string;
  name: string;
  className: string;
  status: string;
  avatarColor: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  netPoints: number;
  behaviorTotal: number;
  positiveBehavior: number;
}

type SortKey = "name" | "attendance" | "netPoints" | "behaviorTotal";

const PAGE_SIZE = 15;

export function StudentsTable({ initialStudents }: { initialStudents: StudentRow[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  const rows = useMemo(() => {
    const withRate = students.map((s) => ({
      ...s,
      attendanceRate: pct(s.present + s.late, s.present + s.late + s.absent + s.excused),
    }));
    const filtered = withRate.filter(
      (s) => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || s.studentCode.toLowerCase().includes(search.toLowerCase()),
    );
    filtered.sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      else if (sortKey === "attendance") diff = a.attendanceRate - b.attendanceRate;
      else if (sortKey === "netPoints") diff = a.netPoints - b.netPoints;
      else if (sortKey === "behaviorTotal") diff = a.behaviorTotal - b.behaviorTotal;
      return diff * sortDir;
    });
    return filtered;
  }, [students, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or student ID..."
            className="input !pl-8"
          />
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={14} /> Add Student
        </button>
      </div>

      <div className="surface overflow-hidden rounded-xl">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <Th label="Student" onClick={() => toggleSort("name")} active={sortKey === "name"} />
                <Th label="Attendance" onClick={() => toggleSort("attendance")} active={sortKey === "attendance"} />
                <Th label="Net Points" onClick={() => toggleSort("netPoints")} active={sortKey === "netPoints"} />
                <Th label="Behavior" onClick={() => toggleSort("behaviorTotal")} active={sortKey === "behaviorTotal"} />
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/students/${s.id}`)}
                  className="cursor-pointer border-b last:border-0 hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.name} color={s.avatarColor} size={30} />
                      <div>
                        <p className="font-medium leading-tight">{s.name}</p>
                        <p className="font-mono text-[0.7rem] leading-tight" style={{ color: "var(--text-faint)" }}>
                          {s.studentCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono">{s.attendanceRate}%</span>
                    <span className="ml-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
                      P{s.present} A{s.absent} L{s.late}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="font-mono font-semibold"
                      style={{ color: s.netPoints > 0 ? "var(--state-present)" : s.netPoints < 0 ? "var(--state-absent)" : "var(--text-faint)" }}
                    >
                      {s.netPoints > 0 ? "+" : ""}
                      {s.netPoints}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono">{s.behaviorTotal}</span>
                    {s.positiveBehavior > 0 && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--sev-positive)" }}>
                        +{s.positiveBehavior} positive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="pill status-excused">{s.status}</span>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-faint)" }}>
                    No students match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-faint)" }}>
              Page {page} of {totalPages} · {rows.length} students
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

      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          onSaved={(student) => {
            setStudents((prev) => [
              ...prev,
              { ...student, present: 0, absent: 0, late: 0, excused: 0, netPoints: 0, behaviorTotal: 0, positiveBehavior: 0 },
            ]);
            setShowAdd(false);
            show(`${student.name} added to roster`);
          }}
        />
      )}
    </div>
  );
}

function Th({ label, onClick, active }: { label: string; onClick: () => void; active: boolean }) {
  return (
    <th className="px-4 py-3 font-medium">
      <button onClick={onClick} className="flex items-center gap-1" style={active ? { color: "var(--brand)" } : undefined}>
        {label} <ArrowUpDown size={11} />
      </button>
    </th>
  );
}

function AddStudentModal({ onClose, onSaved }: { onClose: () => void; onSaved: (student: any) => void }) {
  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [className, setClassName] = useState("Mechanics");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, studentCode, className }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add student");
        return;
      }
      onSaved(data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="animate-fade-in w-full max-w-sm overflow-hidden rounded-xl border shadow-2xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold">Add Student</p>
          <button onClick={onClose} style={{ color: "var(--text-faint)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Full Name
            </p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Ahmed Mohamed" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Student ID (optional)
            </p>
            <input value={studentCode} onChange={(e) => setStudentCode(e.target.value)} className="input" placeholder="Auto-generated if empty" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Class
            </p>
            <input value={className} onChange={(e) => setClassName(e.target.value)} className="input" />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--state-absent)" }}>{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !name.trim()} className="btn btn-primary">
            {saving ? "Saving..." : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
