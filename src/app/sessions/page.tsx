import Link from "next/link";
import { getSessionsList } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { AttendancePill } from "@/components/ui/pills";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { StartSessionButton } from "@/components/dashboard/start-session-button";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = (await getSessionsList()) as any[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
            Every Mechanics session and its summary.
          </p>
        </div>
        <StartSessionButton />
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No Mechanics sessions yet"
          description="Create your first session to begin recording attendance and performance."
          action={<StartSessionButton />}
        />
      ) : (
        <div className="surface overflow-hidden rounded-xl">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Behavior</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <Link href={`/sessions/${s.id}`} className="font-medium hover:underline">
                        S{s.sessionNumber} · {s.topic ?? s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {formatDate(s.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <AttendancePill status="present" />
                        <span className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
                          {s.present}
                        </span>
                        <AttendancePill status="late" />
                        <span className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
                          {s.late}
                        </span>
                        <AttendancePill status="absent" />
                        <span className="font-mono text-xs" style={{ color: "var(--text-faint)" }}>
                          {s.absent}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span style={{ color: "var(--state-present)" }}>+{s.pointsPositive}</span>{" "}
                      <span style={{ color: "var(--state-absent)" }}>{s.pointsNegative}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{s.behaviorTotal}</td>
                    <td className="px-4 py-3">
                      <span className="pill status-excused">{s.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
