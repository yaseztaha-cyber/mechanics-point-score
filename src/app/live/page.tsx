import { db } from "@/db";
import { sessions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { LiveSessionClient } from "@/components/live/live-session-client";
import { StartSessionButton } from "@/components/dashboard/start-session-button";
import { Radio } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LiveSessionPage() {
  const [active] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.status, "in_progress"))
    .orderBy(desc(sessions.date), desc(sessions.sessionNumber))
    .limit(1);

  if (!active) {
    const recent = await db.select().from(sessions).orderBy(desc(sessions.date), desc(sessions.sessionNumber)).limit(5);
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--brand-soft)" }}>
          <Radio size={22} style={{ color: "var(--brand)" }} />
        </div>
        <h1 className="text-xl font-semibold">No active session right now</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--text-faint)" }}>
          Start a new Mechanics session to begin recording attendance, points, and behavior in real time.
        </p>
        <StartSessionButton />
        {recent.length > 0 && (
          <div className="mt-8 w-full text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Recent sessions
            </p>
            <div className="surface divide-y rounded-xl" style={{ borderColor: "var(--border)" }}>
              {recent.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--bg-subtle)]"
                >
                  <span>
                    Session {s.sessionNumber} · {s.topic ?? s.title}
                  </span>
                  <span style={{ color: "var(--text-faint)" }}>{formatDate(s.date as unknown as string)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <LiveSessionClient session={active as any} />;
}
