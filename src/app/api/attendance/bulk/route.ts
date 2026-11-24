import { NextRequest } from "next/server";
import { db } from "@/db";
import { attendanceRecords, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID = ["unmarked", "present", "absent", "late", "excused"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, status, studentIds } = body as {
    sessionId: number;
    status: string;
    studentIds?: number[];
  };
  if (!sessionId || !VALID.includes(status)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const targetIds =
    studentIds && studentIds.length > 0
      ? studentIds
      : (await db.select({ id: students.id }).from(students).where(eq(students.status, "active"))).map((s) => s.id);

  if (targetIds.length === 0) return Response.json({ updated: 0 });

  await db
    .insert(attendanceRecords)
    .values(targetIds.map((studentId) => ({ studentId, sessionId, status })))
    .onConflictDoUpdate({
      target: [attendanceRecords.studentId, attendanceRecords.sessionId],
      set: { status, updatedAt: new Date().toISOString() },
    });

  return Response.json({ updated: targetIds.length });
}
