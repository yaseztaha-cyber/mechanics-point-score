import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  students,
  sessions,
  attendanceRecords,
  pointEvents,
  behaviorIncidents,
  studentNotes,
  behaviorCategories,
  pointCategories,
  settings,
} from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    studentsData,
    sessionsData,
    attendanceData,
    pointsData,
    behaviorsData,
    notesData,
    behaviorCategoriesData,
    pointCategoriesData,
    settingsData,
  ] = await Promise.all([
    db.select().from(students),
    db.select().from(sessions),
    db.select().from(attendanceRecords),
    db.select().from(pointEvents),
    db.select().from(behaviorIncidents),
    db.select().from(studentNotes),
    db.select().from(behaviorCategories),
    db.select().from(pointCategories),
    db.select().from(settings),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    students: studentsData,
    sessions: sessionsData,
    attendanceRecords: attendanceData,
    pointEvents: pointsData,
    behaviorIncidents: behaviorsData,
    studentNotes: notesData,
    behaviorCategories: behaviorCategoriesData,
    pointCategories: pointCategoriesData,
    settings: settingsData,
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mechanics_backup_${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body || typeof body !== "object" || !Array.isArray(body.students)) {
    return Response.json({ error: "Invalid backup file" }, { status: 400 });
  }

  // NOTE: better-sqlite3 transactions are synchronous, so no async callback.
  db.transaction((tx) => {
    tx.run(sql`DELETE FROM audit_log`);
    tx.run(sql`DELETE FROM student_notes`);
    tx.run(sql`DELETE FROM behavior_incidents`);
    tx.run(sql`DELETE FROM point_events`);
    tx.run(sql`DELETE FROM attendance_records`);
    tx.run(sql`DELETE FROM sessions`);
    tx.run(sql`DELETE FROM students`);
    tx.run(sql`DELETE FROM behavior_categories`);
    tx.run(sql`DELETE FROM point_categories`);
    tx.run(sql`DELETE FROM settings`);

    const asIso = (v: unknown) => (typeof v === "string" ? v : new Date(v as string).toISOString());
    if (body.students?.length)
      tx.insert(students).values(body.students.map((s: any) => ({ ...s, createdAt: asIso(s.createdAt) })));
    if (body.sessions?.length)
      tx
        .insert(sessions)
        .values(body.sessions.map((s: any) => ({ ...s, createdAt: asIso(s.createdAt), updatedAt: asIso(s.updatedAt) })));
    if (body.attendanceRecords?.length)
      tx
        .insert(attendanceRecords)
        .values(body.attendanceRecords.map((a: any) => ({ ...a, createdAt: asIso(a.createdAt), updatedAt: asIso(a.updatedAt) })));
    if (body.pointEvents?.length)
      tx.insert(pointEvents).values(body.pointEvents.map((p: any) => ({ ...p, createdAt: asIso(p.createdAt) })));
    if (body.behaviorIncidents?.length)
      tx
        .insert(behaviorIncidents)
        .values(body.behaviorIncidents.map((b: any) => ({ ...b, createdAt: asIso(b.createdAt), updatedAt: asIso(b.updatedAt) })));
    if (body.studentNotes?.length)
      tx.insert(studentNotes).values(body.studentNotes.map((n: any) => ({ ...n, createdAt: asIso(n.createdAt) })));
    if (body.behaviorCategories?.length) tx.insert(behaviorCategories).values(body.behaviorCategories);
    if (body.pointCategories?.length) tx.insert(pointCategories).values(body.pointCategories);
    if (body.settings?.length) tx.insert(settings).values(body.settings);
  });

  return Response.json({ ok: true });
}
