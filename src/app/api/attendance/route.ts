import { NextRequest } from "next/server";
import { db } from "@/db";
import { attendanceRecords, auditLog } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID = ["unmarked", "present", "absent", "late", "excused"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, sessionId, status, note } = body as {
    studentId: number;
    sessionId: number;
    status: string;
    note?: string;
  };
  if (!studentId || !sessionId || !VALID.includes(status)) {
    return Response.json({ error: "Invalid attendance payload" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.studentId, studentId), eq(attendanceRecords.sessionId, sessionId)));

  let row;
  if (existing) {
    [row] = await db
      .update(attendanceRecords)
      .set({ status, note: note ?? existing.note, updatedAt: new Date().toISOString() })
      .where(eq(attendanceRecords.id, existing.id))
      .returning();
    await db.insert(auditLog).values({
      entity: "attendance",
      entityId: row.id,
      action: "update",
      previousValue: existing.status,
      newValue: status,
    });
  } else {
    [row] = await db
      .insert(attendanceRecords)
      .values({ studentId, sessionId, status, note: note ?? null })
      .returning();
    await db.insert(auditLog).values({
      entity: "attendance",
      entityId: row.id,
      action: "create",
      previousValue: null,
      newValue: status,
    });
  }

  return Response.json(row);
}
