"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCheck,
  RotateCcw,
  ShieldAlert,
  StickyNote,
  MoreHorizontal,
  User,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AttendancePill } from "@/components/ui/pills";
import { useToast } from "@/components/providers/toast-provider";
import { PointPopover } from "./point-popover";
import { FloatingPanel } from "./floating-panel";
import { BehaviorModal, type BehaviorSavedPayload } from "./behavior-modal";
import { NoteModal } from "./note-modal";
import { formatTime } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";

interface RosterItem {
  id: number;
  studentCode: string;
  name: string;
  avatarColor: string;
  attendanceStatus: AttendanceStatus;
  attendanceId: number;
  sessionPoints: number;
  sessionBehaviorCount: number;
  netPoints: number;
}

interface SessionRow {
  id: number;
  sessionNumber: number;
  date: string;
  title: string;
  topic: string | null;
  status: string;
}

interface ActionLogEntry {
  id: number;
  text: string;
  ts: number;
}

const ATTENDANCE_BUTTONS: { key: AttendanceStatus; label: string }[] = [
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
  { key: "late", label: "Late" },
  { key: "excused", label: "Excused" },
];

const FILTERS: { key: AttendanceStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
  { key: "late", label: "Late" },
  { key: "excused", label: "Excused" },
  { key: "unmarked", label: "Unmarked" },
];

export function LiveSessionClient({ session }: { session: SessionRow }) {
  const [roster, setRoster] = useState<RosterItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AttendanceStatus | "all">("all");
  const [pointsSummary, setPointsSummary] = useState({ positive: 0, negative: 0 });
  const [behaviorCount, setBehaviorCount] = useState(0);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [selected, setSelected] = useState<RosterItem | null>(null);
  const [behaviorTarget, setBehaviorTarget] = useState<RosterItem | null>(null);
  const [noteTarget, setNoteTarget] = useState<RosterItem | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch(`/api/sessions/${session.id}/roster`).then((r) => r.json()),
      fetch(`/api/sessions/${session.id}`).then((r) => r.json()),
    ]).then(([rosterData, sessionData]) => {
      setRoster(rosterData);
      setPointsSummary({ positive: sessionData.summary.pointsPositive, negative: sessionData.summary.pointsNegative });
      setBehaviorCount(sessionData.summary.behaviorTotal);
    });
  }, [session.id]);

  function logAction(text: string) {
    setActions((prev) => [{ id: Date.now() + Math.random(), text, ts: Date.now() }, ...prev].slice(0, 25));
  }

  function flash(id: number) {
    setFlashId(id);
    window.setTimeout(() => setFlashId((v) => (v === id ? null : v)), 900);
  }

  async function setAttendance(student: RosterItem, status: AttendanceStatus) {
    const prevStatus = student.attendanceStatus;
    if (prevStatus === status) return;
    setRoster((prev) => prev!.map((r) => (r.id === student.id ? { ...r, attendanceStatus: status } : r)));
    flash(student.id);
    logAction(`${student.name} marked ${status}`);
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, sessionId: session.id, status }),
      });
    } catch {
      setRoster((prev) => prev!.map((r) => (r.id === student.id ? { ...r, attendanceStatus: prevStatus } : r)));
      show("Could not update attendance", { tone: "error" });
    }
  }

  async function markAllPresent() {
    if (!roster) return;
    setRoster((prev) => prev!.map((r) => ({ ...r, attendanceStatus: "present" })));
    logAction("Marked all students present");
    await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, status: "present" }),
    });
    show("All students marked present");
  }

  async function resetAttendance() {
    if (!roster) return;
    setRoster((prev) => prev!.map((r) => ({ ...r, attendanceStatus: "unmarked" })));
    logAction("Reset attendance for all students");
    await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, status: "unmarked" }),
    });
    show("Attendance reset");
  }

  async function addPoints(student: RosterItem, value: number, reason: string) {
    setRoster((prev) =>
      prev!.map((r) =>
        r.id === student.id ? { ...r, sessionPoints: r.sessionPoints + value, netPoints: r.netPoints + value } : r,
      ),
    );
    setPointsSummary((p) => (value > 0 ? { ...p, positive: p.positive + value } : { ...p, negative: p.negative + value }));
    flash(student.id);
    logAction(`${student.name} ${value > 0 ? "+" : ""}${value} (${reason})`);
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, sessionId: session.id, points: value, reason, category: value > 0 ? "General" : "Deduction" }),
      });
      const row = await res.json();
      show(`${value > 0 ? "+" : ""}${value} added to ${student.name}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            await fetch(`/api/points?id=${row.id}`, { method: "DELETE" });
            setRoster((prev) =>
              prev!.map((r) =>
                r.id === student.id ? { ...r, sessionPoints: r.sessionPoints - value, netPoints: r.netPoints - value } : r,
              ),
            );
            setPointsSummary((p) => (value > 0 ? { ...p, positive: p.positive - value } : { ...p, negative: p.negative - value }));
          },
        },
      });
    } catch {
      show("Could not save points", { tone: "error" });
    }
  }

  function onBehaviorSaved(student: RosterItem, payload: BehaviorSavedPayload) {
    setRoster((prev) =>
      prev!.map((r) =>
        r.id === student.id
          ? {
              ...r,
              sessionBehaviorCount: r.sessionBehaviorCount + 1,
              sessionPoints: r.sessionPoints + (payload.relatedPoints || 0),
              netPoints: r.netPoints + (payload.relatedPoints || 0),
            }
          : r,
      ),
    );
    setBehaviorCount((c) => c + 1);
    if (payload.relatedPoints) {
      setPointsSummary((p) =>
        payload.relatedPoints > 0 ? { ...p, positive: p.positive + payload.relatedPoints } : { ...p, negative: p.negative + payload.relatedPoints },
      );
    }
    flash(student.id);
    logAction(`${student.name} — ${payload.category} (${payload.severity})`);
    setBehaviorTarget(null);
    show(`Behavior recorded for ${student.name}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const q = payload.pointEventId ? `?pointEventId=${payload.pointEventId}` : "";
          await fetch(`/api/behaviors/${payload.id}${q}`, { method: "DELETE" });
          setRoster((prev) =>
            prev!.map((r) =>
              r.id === student.id
                ? {
                    ...r,
                    sessionBehaviorCount: r.sessionBehaviorCount - 1,
                    sessionPoints: r.sessionPoints - (payload.relatedPoints || 0),
                    netPoints: r.netPoints - (payload.relatedPoints || 0),
                  }
                : r,
            ),
          );
          setBehaviorCount((c) => c - 1);
        },
      },
    });
  }

  async function completeSession() {
    await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    router.push(`/sessions/${session.id}`);
    router.refresh();
  }

  const filtered = useMemo(() => {
    if (!roster) return [];
    return roster.filter((r) => {
      const matchesSearch =
        !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()) || r.studentCode.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || r.attendanceStatus === filter;
      return matchesSearch && matchesFilter;
    });
  }, [roster, search, filter]);

  const counts = useMemo(() => {
    const base = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    for (const r of roster ?? []) base[r.attendanceStatus as keyof typeof base]++;
    return base;
  }, [roster]);

  const netPoints = pointsSummary.positive + pointsSummary.negative;
  const locked = session.status === "completed" || session.status === "locked";

  return (
    <div className="flex min-h-[calc(100vh-49px)] flex-col">
      {/* Top bar */}
      <div className="sticky top-[49px] z-20 border-b px-4 py-3 md:px-6" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand)" }}>
              Session {session.sessionNumber} {locked && "· Completed"}
            </p>
            <h1 className="text-lg font-semibold">{session.topic ?? session.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/sessions/${session.id}`} className="btn">
              Summary
            </Link>
            {!locked &&
              (confirmComplete ? (
                <button onClick={completeSession} className="btn btn-primary">
                  <CheckCircle2 size={14} /> Confirm Complete
                </button>
              ) : (
                <button onClick={() => setConfirmComplete(true)} className="btn btn-primary">
                  Complete Session
                </button>
              ))}
            {locked && (
              <span className="pill status-excused">
                <Lock size={11} /> Locked
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 overflow-x-auto">
          <CounterChip label="Present" value={counts.present} tone="present" />
          <CounterChip label="Late" value={counts.late} tone="late" />
          <CounterChip label="Excused" value={counts.excused} tone="excused" />
          <CounterChip label="Absent" value={counts.absent} tone="absent" />
          <div className="mx-1 w-px self-stretch" style={{ background: "var(--border)" }} />
          <CounterChip label="Points +" value={`+${pointsSummary.positive}`} tone="present" plain />
          <CounterChip label="Deductions" value={pointsSummary.negative} tone="absent" plain />
          <CounterChip label="Net" value={`${netPoints >= 0 ? "+" : ""}${netPoints}`} tone={netPoints >= 0 ? "present" : "absent"} plain />
          <CounterChip label="Behavior" value={behaviorCount} tone="late" plain />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row">
        {/* Main list */}
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="input !pl-8"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="btn !px-2.5 !py-1.5 text-xs"
                  style={filter === f.key ? { background: "var(--brand-soft)", borderColor: "var(--brand)", color: "var(--brand-strong)" } : undefined}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {!locked && (
              <div className="flex gap-2">
                <button onClick={markAllPresent} className="btn">
                  <CheckCheck size={14} /> Mark All Present
                </button>
                <button onClick={resetAttendance} className="btn">
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            )}
          </div>

          {!roster ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "var(--bg-subtle)" }} />
              ))}
            </div>
          ) : (
            <div className="surface overflow-hidden rounded-xl">
              {filtered.length === 0 && (
                <p className="p-6 text-center text-sm" style={{ color: "var(--text-faint)" }}>
                  No students match your search or filter.
                </p>
              )}
              <ul>
                {filtered.map((student) => (
                  <li
                    key={student.id}
                    className={`flex flex-wrap items-center gap-2.5 border-b px-3 py-2.5 transition-colors last:border-0 hover:bg-[var(--bg-subtle)] md:gap-3 ${flashId === student.id ? "animate-flash-row" : ""}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <button className="flex min-w-[160px] flex-1 items-center gap-2.5 text-left" onClick={() => setSelected(student)}>
                      <Avatar name={student.name} color={student.avatarColor} size={32} />
                      <span>
                        <span className="block text-sm font-medium leading-tight">{student.name}</span>
                        <span className="block font-mono text-[0.7rem] leading-tight" style={{ color: "var(--text-faint)" }}>
                          {student.studentCode}
                        </span>
                      </span>
                    </button>

                    <div className="flex gap-1">
                      {ATTENDANCE_BUTTONS.map((b) => {
                        const active = student.attendanceStatus === b.key;
                        return (
                          <button
                            key={b.key}
                            disabled={locked}
                            onClick={() => setAttendance(student, b.key)}
                            className="pill"
                            style={{
                              background: active ? `var(--state-${b.key}-bg)` : "var(--bg-subtle)",
                              color: active ? `var(--state-${b.key})` : "var(--text-faint)",
                              cursor: locked ? "default" : "pointer",
                            }}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="pill"
                        style={{
                          color: student.sessionPoints > 0 ? "var(--state-present)" : student.sessionPoints < 0 ? "var(--state-absent)" : "var(--text-faint)",
                          background: student.sessionPoints > 0 ? "var(--state-present-bg)" : student.sessionPoints < 0 ? "var(--state-absent-bg)" : "var(--bg-subtle)",
                        }}
                      >
                        {student.sessionPoints > 0 ? "+" : ""}
                        {student.sessionPoints} today
                      </span>
                      {!locked && <PointPopover onPick={(v, reason) => addPoints(student, v, reason)} />}
                    </div>

                    {!locked && (
                      <button onClick={() => setBehaviorTarget(student)} className="btn !px-2 !py-1 text-xs">
                        <ShieldAlert size={12} /> Behavior
                        {student.sessionBehaviorCount > 0 && (
                          <span className="pill sev-moderate !px-1.5">{student.sessionBehaviorCount}</span>
                        )}
                      </button>
                    )}

                    {!locked && (
                      <button onClick={() => setNoteTarget(student)} className="btn !px-2 !py-1 text-xs">
                        <StickyNote size={12} />
                      </button>
                    )}

                    <RowMenu student={student} open={menuOpenId === student.id} onToggle={() => setMenuOpenId((v) => (v === student.id ? null : student.id))} onClose={() => setMenuOpenId(null)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="w-full shrink-0 lg:w-80">
          <div className="surface sticky top-[150px] rounded-xl p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Selected Student
            </p>
            {selected ? (
              <div>
                <div className="flex items-center gap-2.5">
                  <Avatar name={selected.name} color={selected.avatarColor} size={38} />
                  <div>
                    <p className="text-sm font-semibold">{selected.name}</p>
                    <p className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
                      {selected.studentCode}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-faint)" }}>Attendance today</span>
                  <AttendancePill status={selected.attendanceStatus} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-faint)" }}>Points today</span>
                  <span className="font-mono font-semibold">{selected.sessionPoints >= 0 ? "+" : ""}{selected.sessionPoints}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-faint)" }}>Net points (all time)</span>
                  <span className="font-mono font-semibold">{selected.netPoints >= 0 ? "+" : ""}{selected.netPoints}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-faint)" }}>Behavior today</span>
                  <span className="font-mono font-semibold">{selected.sessionBehaviorCount}</span>
                </div>
                <Link href={`/students/${selected.id}`} className="btn mt-3 w-full justify-center">
                  View Full Profile
                </Link>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Tap a student&rsquo;s name to see a quick overview here without leaving the session.
              </p>
            )}

            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Recent Actions
              </p>
              {actions.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                  Actions you record will appear here.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 text-xs">
                  {actions.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2" style={{ color: "var(--text-muted)" }}>
                      <span>{a.text}</span>
                      <span className="shrink-0 font-mono" style={{ color: "var(--text-faint)" }}>
                        {formatTime(new Date(a.ts))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {behaviorTarget && (
        <BehaviorModal
          studentId={behaviorTarget.id}
          studentName={behaviorTarget.name}
          sessionId={session.id}
          onClose={() => setBehaviorTarget(null)}
          onSaved={(payload) => onBehaviorSaved(behaviorTarget, payload)}
        />
      )}
      {noteTarget && (
        <NoteModal
          studentId={noteTarget.id}
          studentName={noteTarget.name}
          sessionId={session.id}
          onClose={() => setNoteTarget(null)}
          onSaved={() => {
            setNoteTarget(null);
            show(`Note added for ${noteTarget.name}`);
          }}
        />
      )}
    </div>
  );
}

function RowMenu({ student, open, onToggle, onClose }: { student: RosterItem; open: boolean; onToggle: () => void; onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button ref={btnRef} onClick={onToggle} className="btn !px-2 !py-1" aria-label={`More actions for ${student.name}`}>
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <FloatingPanel anchorRef={btnRef} onClose={onClose} width={160}>
          <div className="overflow-hidden">
            <Link
              href={`/students/${student.id}`}
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-subtle)]"
            >
              <User size={12} /> View Profile
            </Link>
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}

function CounterChip({
  label,
  value,
  tone,
  plain,
}: {
  label: string;
  value: string | number;
  tone: "present" | "absent" | "late" | "excused";
  plain?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
      style={{ background: plain ? "var(--bg-subtle)" : `var(--state-${tone}-bg)`, color: plain ? "var(--text-muted)" : `var(--state-${tone})` }}
    >
      <span className="font-mono font-semibold">{value}</span>
      <span>{label}</span>
    </div>
  );
}
