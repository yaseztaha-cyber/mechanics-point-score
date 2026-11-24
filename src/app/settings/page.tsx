import { db } from "@/db";
import { pointCategories, behaviorCategories, settings } from "@/db/schema";
import { asc } from "drizzle-orm";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [pCats, bCats, settingsRows] = await Promise.all([
    db.select().from(pointCategories).orderBy(asc(pointCategories.sortOrder)),
    db.select().from(behaviorCategories).orderBy(asc(behaviorCategories.sortOrder)),
    db.select().from(settings),
  ]);

  const settingsMap = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-7 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          Class configuration, point &amp; behavior categories, roster import, and backups.
        </p>
      </div>
      <SettingsClient pointCategories={pCats} behaviorCategories={bCats} settingsMap={settingsMap} />
    </div>
  );
}
