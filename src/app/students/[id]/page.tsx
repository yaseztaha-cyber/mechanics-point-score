import { notFound } from "next/navigation";
import { getStudentDetail, getSessionsList } from "@/lib/queries";
import { formatDateTime, signed } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { AttendancePill, SeverityPill } from "@/components/ui/pills";
import { QuickActionsBar } from "@/components/students/quick-actions-bar";
import { PointsChart } from "@/components/students/points-chart";
import { repeatedBehaviorAlert } from "@/lib/analytics";
import { FileDown, CheckCircle2, XCircle, Clock, TrendingUp, ShieldAlert, StickyNote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getStudentDetail(Number(id));
  if (!data) notFound();
  const { student, stats, timeline, chart, notes } = data;

  const allSessions = (await getSessionsList()) as any[];
  const recentSessionIds = allSessions.slice(0, 6).map((s) => s.id);
  const alertMessage = repeatedBehaviorAlert(
    data.behaviors.map((b: any) => ({ severity: b.severity, category: b.category, sessionId: b.session_id, createdAt: b.created_at })),
    recentSessionIds,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={student.name} color={student.avatar_color} size={52} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
            <p className="font-mono text-sm" style={{ color: "var(--text-faint)" }}>
              {student.student_code} · {student.class_name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickActionsBar studentId={student.id} studentName={student.name} />
          <a href={`/api/reports/student/${student.id}`} className="btn">
            <FileDown size={14} /> Export PDF
          </a>
        </div>
      </div>

      {alertMessage && (
        <div className="surface mb-5 flex items-center gap-2.5 rounded-xl border-l-4 p-3.5 text-sm" style={{ borderLeftColor: "var(--sev-moderate)" }}>
          <ShieldAlert size={16} style={{ color: "var(--sev-moderate)" }} />
          <span>
            {student.name} has {alertMessage} — follow-up recommended.
          </span>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Attendance" value={`${stats.attendance.rate}%`} />
        <Metric label="Sessions" value={String(stats.attendance.total)} />
        <Metric label="Absent" value={String(stats.attendance.absent)} tone={stats.attendance.absent > 0 ? "absent" : undefined} />
        <Metric label="Late" value={String(stats.attendance.late)} tone={stats.attendance.late > 0 ? "late" : undefined} />
        <Metric label="Net Points" value={signed(stats.points.net)} tone={stats.points.net >= 0 ? "present" : "absent"} />
        <Metric label="Behavior" value={`${stats.behavior.total} incidents`} tone={stats.behavior.total > 0 ? "late" : undefined} />
      </div>

      {/* Chart */}
      <section className="surface mt-6 rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            <TrendingUp size={15} style={{ color: "var(--brand)" }} /> Cumulative Points Trajectory
          </h3>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            Avg {signed(stats.points.average)} / session
          </span>
        </div>
        <PointsChart data={chart} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stats breakdown */}
        <section className="lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Attendance
          </h3>
          <div className="surface mb-6 rounded-xl p-4 text-sm">
            <Row label="Present" value={stats.attendance.present} />
            <Row label="Absent" value={stats.attendance.absent} />
            <Row label="Late" value={stats.attendance.late} />
            <Row label="Excused" value={stats.attendance.excused} />
          </div>

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Points
          </h3>
          <div className="surface mb-6 rounded-xl p-4 text-sm">
            <Row label="Positive" value={signed(stats.points.positive)} />
            <Row label="Negative" value={signed(stats.points.negative)} />
            <Row label="Net" value={signed(stats.points.net)} />
            <Row label="Best Session" value={stats.points.best ? signed(stats.points.best.total) : "—"} />
            <Row label="Worst Session" value={stats.points.worst ? signed(stats.points.worst.total) : "—"} />
          </div>

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Behavior
          </h3>
          <div className="surface rounded-xl p-4 text-sm">
            <Row label="Minor" value={stats.behavior.minor} />
            <Row label="Moderate" value={stats.behavior.moderate} />
            <Row label="Serious" value={stats.behavior.serious} />
            <Row label="Positive" value={stats.behavior.positive} />
          </div>

          {notes.length > 0 && (
            <>
              <h3 className="mb-3 mt-6 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                <StickyNote size={13} /> Notes
              </h3>
              <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
                {notes.slice(0, 6).map((n: any) => (
                  <div key={n.id} className="px-3.5 py-2.5 text-sm">
                    <p>{n.content}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                      {n.category} · {formatDateTime(n.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Timeline */}
        <section className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Activity Timeline
          </h3>
          {timeline.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              No activity recorded yet for this student.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {timeline.map((item: any, i: number) => (
                <li key={i} className="animate-fade-in surface flex gap-3 rounded-xl p-3.5">
                  <div className="mt-0.5 shrink-0">
                    {item.kind === "attendance" && item.data.status === "present" && <CheckCircle2 size={16} style={{ color: "var(--state-present)" }} />}
                    {item.kind === "attendance" && item.data.status === "absent" && <XCircle size={16} style={{ color: "var(--state-absent)" }} />}
                    {item.kind === "attendance" && (item.data.status === "late" || item.data.status === "excused") && (
                      <Clock size={16} style={{ color: "var(--state-late)" }} />
                    )}
                    {item.kind === "point" && (
                      <span className="font-mono text-sm font-bold" style={{ color: item.data.points >= 0 ? "var(--state-present)" : "var(--state-absent)" }}>
                        {signed(item.data.points)}
                      </span>
                    )}
                    {item.kind === "behavior" && <ShieldAlert size={16} style={{ color: "var(--sev-moderate)" }} />}
                    {item.kind === "note" && <StickyNote size={16} style={{ color: "var(--brand)" }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {item.kind === "attendance" && <AttendancePill status={item.data.status} />}
                        {item.kind === "point" && (item.data.reason || item.data.category)}
                        {item.kind === "behavior" && (
                          <span className="flex items-center gap-2">
                            {item.data.category} <SeverityPill severity={item.data.severity} />
                          </span>
                        )}
                        {item.kind === "note" && `Note · ${item.data.category}`}
                      </p>
                      <span className="shrink-0 text-xs" style={{ color: "var(--text-faint)" }}>
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                    {item.sessionTitle && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                        {item.sessionTitle}
                      </p>
                    )}
                    {item.kind === "behavior" && item.data.description && <p className="mt-1 text-sm">{item.data.description}</p>}
                    {item.kind === "behavior" && item.data.relatedPoints !== 0 && (
                      <p className="mt-1 text-xs font-mono" style={{ color: item.data.relatedPoints > 0 ? "var(--state-present)" : "var(--state-absent)" }}>
                        {signed(item.data.relatedPoints)} points
                      </p>
                    )}
                    {item.kind === "note" && <p className="mt-1 text-sm">{item.data.content}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "present" | "absent" | "late" }) {
  return (
    <div className="surface rounded-xl p-3.5">
      <p className="font-mono text-lg font-semibold" style={{ color: tone ? `var(--state-${tone})` : "var(--text)" }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}


