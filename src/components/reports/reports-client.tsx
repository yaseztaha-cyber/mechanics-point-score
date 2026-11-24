"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, GraduationCap, Users, DatabaseBackup, Upload } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

interface StudentOption {
  id: number;
  name: string;
  studentCode: string;
}

export function ReportsClient({ students }: { students: StudentOption[] }) {
  const [studentId, setStudentId] = useState<string>(students[0]?.id ? String(students[0].id) : "");
  const { show } = useToast();

  return (
    <div className="flex flex-col gap-6">
      <section className="surface rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
            <Users size={16} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold">Class Report (PDF)</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Class summary, attendance overview, point rankings, behavior overview, and students needing attention.
            </p>
          </div>
        </div>
        <a href="/api/reports/class" className="btn btn-primary">
          <FileDown size={14} /> Download Class PDF
        </a>
      </section>

      <section className="surface rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
            <GraduationCap size={16} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold">Individual Student Report (PDF)</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Attendance history, point events, behavior incidents, notes, and performance trend for one student.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input w-auto min-w-[220px]">
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.studentCode})
              </option>
            ))}
          </select>
          <a
            href={studentId ? `/api/reports/student/${studentId}` : "#"}
            onClick={(e) => {
              if (!studentId) {
                e.preventDefault();
                show("Add a student first", { tone: "error" });
              }
            }}
            className="btn btn-primary"
          >
            <FileDown size={14} /> Download Student PDF
          </a>
        </div>
      </section>

      <section className="surface rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
            <FileSpreadsheet size={16} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold">Full Excel Export</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Students, Sessions, Attendance, Points, Behaviors, Notes, Student Summary, and Session Summary — one workbook.
            </p>
          </div>
        </div>
        <a href="/api/reports/excel" className="btn btn-primary">
          <FileDown size={14} /> Download Excel Workbook
        </a>
      </section>

      <section className="surface rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
            <DatabaseBackup size={16} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold">Complete Data Backup</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              A full JSON backup of students, sessions, attendance, points, behavior, notes, and settings. Manage restores in Settings.
            </p>
          </div>
        </div>
        <a href="/api/backup" className="btn">
          <Upload size={14} /> Download Backup JSON
        </a>
      </section>
    </div>
  );
}
