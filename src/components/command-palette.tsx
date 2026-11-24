"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, CalendarDays, CornerDownLeft } from "lucide-react";

interface StudentResult {
  id: number;
  name: string;
  studentCode: string;
  sessions: number;
  attendanceRate: number;
  netPoints: number;
  behaviorTotal: number;
}
interface SessionResult {
  id: number;
  sessionNumber: number;
  title: string;
  topic: string | null;
  date: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [sessionsRes, setSessionsRes] = useState<SessionResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA"].includes(target?.tagName) || target?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTyping)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeydown);
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQ("");
      setStudents([]);
      setSessionsRes([]);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setStudents([]);
      setSessionsRes([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setStudents(data.students ?? []);
      setSessionsRes(data.sessions ?? []);
    }, 180);
    return () => clearTimeout(handle);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/35 px-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
    >
      <div
        className="animate-fade-in w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <Search size={16} style={{ color: "var(--text-faint)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students, sessions, dates..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="max-h-[55vh] overflow-y-auto scrollbar-thin p-2">
          {!q.trim() && (
            <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-faint)" }}>
              Start typing to find a student or session
            </p>
          )}
          {students.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Students
              </p>
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    router.push(`/students/${s.id}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-[var(--bg-subtle)]"
                >
                  <span className="flex items-center gap-2.5">
                    <User size={15} style={{ color: "var(--brand)" }} />
                    <span>
                      <span className="block text-sm font-medium">{s.name}</span>
                      <span className="block text-xs" style={{ color: "var(--text-faint)" }}>
                        {s.sessions} sessions · {s.attendanceRate}% attendance · {s.netPoints >= 0 ? "+" : ""}
                        {s.netPoints} pts · {s.behaviorTotal} incidents
                      </span>
                    </span>
                  </span>
                  <CornerDownLeft size={13} style={{ color: "var(--text-faint)" }} />
                </button>
              ))}
            </div>
          )}
          {sessionsRes.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Sessions
              </p>
              {sessionsRes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    router.push(`/sessions/${s.id}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-[var(--bg-subtle)]"
                >
                  <span className="flex items-center gap-2.5">
                    <CalendarDays size={15} style={{ color: "var(--accent)" }} />
                    <span>
                      <span className="block text-sm font-medium">
                        Session {s.sessionNumber} · {s.title}
                      </span>
                      <span className="block text-xs" style={{ color: "var(--text-faint)" }}>
                        {s.date}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {q.trim() && students.length === 0 && sessionsRes.length === 0 && (
            <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-faint)" }}>
              No matches for &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
