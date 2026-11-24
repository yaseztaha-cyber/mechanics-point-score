import Link from "next/link";
import { getBehaviorDashboardData } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { SeverityPill } from "@/components/ui/pills";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { BehaviorFilterTable } from "@/components/behavior/behavior-filter-table";

export const dynamic = "force-dynamic";

export default async function BehaviorPage() {
  const data = await getBehaviorDashboardData();
  const { totals, trend, topCategories, repeatedStudents, recent } = data;

  const trendDiff = trend.lastMonth > 0 ? Math.round(((trend.thisMonth - trend.lastMonth) / trend.lastMonth) * 100) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Behavior</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          Class-wide behavior incidents, trends, and students needing follow-up.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Total Incidents" value={totals.total} />
        <Metric label="Positive" value={totals.positive} tone="present" />
        <Metric label="Minor" value={totals.minor} tone="late" />
        <Metric label="Moderate" value={totals.moderate} tone="late" />
        <Metric label="Serious" value={totals.serious} tone="absent" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="surface rounded-2xl p-5 lg:col-span-1">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {trendDiff !== null && trendDiff < 0 ? (
              <TrendingDown size={15} style={{ color: "var(--state-present)" }} />
            ) : (
              <TrendingUp size={15} style={{ color: "var(--sev-moderate)" }} />
            )}
            Monthly Trend
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {trend.thisMonth} incidents recorded this month
            {trend.lastMonth > 0 && trendDiff !== null && (
              <>
                {" "}
                — {trendDiff <= 0 ? `down ${Math.abs(trendDiff)}%` : `up ${trendDiff}%`} compared with last month ({trend.lastMonth}).
              </>
            )}
          </p>

          <h3 className="mb-2 mt-5 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Most Common Categories
          </h3>
          {topCategories.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              No categories recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {topCategories.map((c: any) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span>{c.category}</span>
                  <span className="font-mono font-medium" style={{ color: "var(--text-faint)" }}>
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mb-2 mt-5 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Repeated Incidents (last 6 sessions)
          </h3>
          {repeatedStudents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              No students currently flagged for repeated incidents.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {(repeatedStudents as any[]).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <Link href={`/students/${s.id}`} className="hover:underline">
                    {s.name}
                  </Link>
                  <span className="pill sev-moderate">{s.incidents} incidents</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Recent Incidents
          </h3>
          {recent.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No behavior incidents recorded"
              description="That's good — there is nothing requiring attention right now."
            />
          ) : (
            <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
              {(recent as any[]).map((r) => (
                <div key={r.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/students/${r.studentId}`} className="font-medium hover:underline">
                      {r.studentName}
                    </Link>
                    <SeverityPill severity={r.severity} />
                  </div>
                  <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {r.category}
                    {r.description ? ` — ${r.description}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                    {r.sessionTitle ? `${r.sessionTitle} · ` : ""}
                    {formatDateTime(r.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
          All Incidents
        </h3>
        <BehaviorFilterTable />
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "present" | "absent" | "late" }) {
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
