import Link from "next/link";
import { getDashboardData } from "@/lib/queries";
import { formatDate, formatDateTime, signed } from "@/lib/format";
import { ArrowRight, TrendingUp, UserCheck, ShieldAlert, Plus } from "lucide-react";
import { StartSessionButton } from "@/components/dashboard/start-session-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getDashboardData();
  const { todaySession, todayStats, totals, recentActivity, alerts } = data;

  const totalMarked = todayStats
    ? todayStats.present + todayStats.absent + todayStats.late + todayStats.excused
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
            Mechanics
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{formatDate(data.date)}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/students" className="btn">
            <Plus size={14} /> Add Student
          </Link>
          {!todaySession && <StartSessionButton />}
          {todaySession && (
            <Link href="/live" className="btn btn-primary">
              Go to Live Session <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Current Session */}
      <section className="surface rounded-2xl p-5 shadow-sm md:p-6">
        {todaySession ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                  Current Session · Session {todaySession.sessionNumber}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{todaySession.topic ?? todaySession.title}</h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-semibold">
                  {todayStats ? todayStats.present + todayStats.late : 0}
                  <span style={{ color: "var(--text-faint)" }}> / {totals.students}</span>
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Present + Late
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <LiveIndicator label="Present" value={todayStats?.present ?? 0} tone="present" />
              <LiveIndicator label="Late" value={todayStats?.late ?? 0} tone="late" />
              <LiveIndicator label="Excused" value={todayStats?.excused ?? 0} tone="excused" />
              <LiveIndicator label="Absent" value={todayStats?.absent ?? 0} tone="absent" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <PointStrip label="Points Gained" value={signed(todayStats?.pointsPositive ?? 0)} positive />
              <PointStrip label="Deductions" value={signed(todayStats?.pointsNegative ?? 0)} />
              <PointStrip
                label="Net"
                value={signed((todayStats?.pointsPositive ?? 0) + (todayStats?.pointsNegative ?? 0))}
                positive={(todayStats?.pointsPositive ?? 0) + (todayStats?.pointsNegative ?? 0) >= 0}
              />
            </div>
            {totalMarked < totals.students && (
              <p className="mt-4 text-xs" style={{ color: "var(--text-faint)" }}>
                {totals.students - totalMarked} student(s) not yet marked for this session.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm font-semibold">No session has been started today</p>
            <p className="max-w-sm text-sm" style={{ color: "var(--text-faint)" }}>
              Start today&rsquo;s Mechanics session to begin recording attendance, points, and behavior live.
            </p>
            <StartSessionButton />
          </div>
        )}
      </section>

      {/* Class stats strip */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={UserCheck} label="Active Students" value={String(totals.students)} />
        <StatCard icon={TrendingUp} label="Overall Attendance" value={`${totals.attendanceRate}%`} />
        <StatCard icon={ShieldAlert} label="Total Sessions" value={String(totals.sessions)} />
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Alerts */}
        <section className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Needs Attention
          </h3>
          {alerts.length === 0 ? (
            <div className="surface rounded-xl p-4 text-sm" style={{ color: "var(--text-faint)" }}>
              No alerts right now — attendance and behavior trends look healthy.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <div key={i} className="surface flex items-start gap-2.5 rounded-xl p-3.5">
                  <ShieldAlert
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: a.type === "attendance" ? "var(--state-late)" : "var(--sev-moderate)" }}
                  />
                  <p className="text-sm">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Recent Activity
            </h3>
            <Link href="/history" className="text-xs font-medium" style={{ color: "var(--brand)" }}>
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="surface rounded-xl p-4 text-sm" style={{ color: "var(--text-faint)" }}>
              No activity recorded yet.
            </div>
          ) : (
            <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
              {(recentActivity as any[]).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)" }}>
                  <p>
                    <span className="font-medium">{item.student_name}</span>{" "}
                    <span style={{ color: "var(--text-faint)" }}>
                      {item.kind === "attendance" && `marked ${item.detail}`}
                      {item.kind === "point" && (
                        <>
                          received{" "}
                          <span style={{ color: item.points >= 0 ? "var(--state-present)" : "var(--state-absent)" }}>
                            {signed(item.points)}
                          </span>{" "}
                          for {item.detail}
                        </>
                      )}
                      {item.kind === "behavior" && `received a behavior record: ${item.detail}`}
                    </span>
                  </p>
                  <span className="shrink-0 text-xs" style={{ color: "var(--text-faint)" }}>
                    {formatDateTime(item.ts)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LiveIndicator({ label, value, tone }: { label: string; value: number; tone: "present" | "late" | "excused" | "absent" }) {
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

function PointStrip({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--border)" }}>
      <p
        className="font-mono text-lg font-semibold"
        style={{ color: positive === undefined ? "var(--text)" : positive ? "var(--state-present)" : "var(--state-absent)" }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="surface flex items-center gap-3 rounded-xl p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
        <Icon size={16} style={{ color: "var(--brand)" }} />
      </div>
      <div>
        <p className="font-mono text-lg font-semibold leading-tight">{value}</p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
