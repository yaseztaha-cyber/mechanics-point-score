import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionDetail } from "@/lib/queries";
import { formatDate, formatDateTime, signed } from "@/lib/format";
import { SeverityPill } from "@/components/ui/pills";
import { SessionActions } from "@/components/sessions/session-actions";
import { Users, TrendingUp, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSessionDetail(Number(id));
  if (!data) notFound();

  const { session, summary, points, behaviors } = data;
  const netPoints = summary.pointsPositive + summary.pointsNegative;

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand)" }}>
            Session {session.session_number} · {formatDate(session.date)}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{session.topic ?? session.title}</h1>
        </div>
        <SessionActions sessionId={session.id} status={session.status} />
      </div>

      <section className="surface rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          Session {session.status === "completed" || session.status === "locked" ? "Complete" : "Overview"} · {summary.totalStudents} Students
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Present" value={summary.present} tone="present" />
          <Metric label="Late" value={summary.late} tone="late" />
          <Metric label="Excused" value={summary.excused} tone="excused" />
          <Metric label="Absent" value={summary.absent} tone="absent" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <PlainMetric label="Positive" value={signed(summary.pointsPositive)} tone="present" />
          <PlainMetric label="Negative" value={signed(summary.pointsNegative)} tone="absent" />
          <PlainMetric label="Net" value={signed(netPoints)} tone={netPoints >= 0 ? "present" : "absent"} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InsightCard
            icon={TrendingUp}
            title="Top Participation"
            body={
              summary.topParticipation.length
                ? summary.topParticipation.map((p: any) => `${p.name} ${signed(p.total)}`).join(" · ")
                : "No positive point events recorded yet."
            }
          />
          <InsightCard
            icon={Users}
            title="Attendance Concern"
            body={summary.absent > 0 ? `${summary.absent} student(s) absent: ${summary.absentStudents.join(", ")}` : "Everyone attended or was accounted for."}
          />
          <InsightCard
            icon={ShieldAlert}
            title="Behavior Follow-up"
            body={summary.followUpBehaviors > 0 ? `${summary.followUpBehaviors} incident(s) require review.` : "No moderate or serious incidents."}
          />
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Point Events ({points.length})
          </h3>
          {points.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              No point events recorded for this session.
            </p>
          ) : (
            <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
              {points.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div>
                    <Link href={`/students/${p.studentId}`} className="font-medium hover:underline">
                      {p.studentName}
                    </Link>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {p.category}
                      {p.reason ? ` · ${p.reason}` : ""}
                    </p>
                  </div>
                  <span className="font-mono font-semibold" style={{ color: p.points >= 0 ? "var(--state-present)" : "var(--state-absent)" }}>
                    {signed(p.points)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Behavior Incidents ({behaviors.length})
          </h3>
          {behaviors.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              No behavior incidents — that&rsquo;s good.
            </p>
          ) : (
            <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
              {behaviors.map((b: any) => (
                <div key={b.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/students/${b.studentId}`} className="font-medium hover:underline">
                      {b.studentName}
                    </Link>
                    <SeverityPill severity={b.severity} />
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                    {b.category}
                    {b.description ? ` — ${b.description}` : ""}
                  </p>
                  <p className="mt-0.5 text-[0.7rem]" style={{ color: "var(--text-faint)" }}>
                    {formatDateTime(b.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "present" | "absent" | "late" | "excused" }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: `var(--state-${tone}-bg)` }}>
      <p className="font-mono text-xl font-semibold" style={{ color: `var(--state-${tone})` }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: `var(--state-${tone})` }}>
        {label}
      </p>
    </div>
  );
}

function PlainMetric({ label, value, tone }: { label: string; value: string; tone: "present" | "absent" }) {
  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--border)" }}>
      <p className="font-mono text-lg font-semibold" style={{ color: `var(--state-${tone})` }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
    </div>
  );
}

function InsightCard({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={14} style={{ color: "var(--brand)" }} />
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          {title}
        </p>
      </div>
      <p className="text-sm">{body}</p>
    </div>
  );
}
