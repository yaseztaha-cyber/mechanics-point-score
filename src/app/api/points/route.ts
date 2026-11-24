import { NextRequest } from "next/server";
import { db } from "@/db";
import { pointEvents, students } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const conditions = [];
  if (studentId) conditions.push(eq(pointEvents.studentId, Number(studentId)));
  if (sessionId) conditions.push(eq(pointEvents.sessionId, Number(sessionId)));

  const rows = await db
    .select({
      id: pointEvents.id,
      studentId: pointEvents.studentId,
      studentName: students.name,
      sessionId: pointEvents.sessionId,
      points: pointEvents.points,
      category: pointEvents.category,
      reason: pointEvents.reason,
      note: pointEvents.note,
      recordedBy: pointEvents.recordedBy,
      createdAt: pointEvents.createdAt,
    })
    .from(pointEvents)
    .innerJoin(students, eq(students.id, pointEvents.studentId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(pointEvents.createdAt))
    .limit(200);

  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, sessionId, points, category, reason, note, recordedBy } = body as {
    studentId: number;
    sessionId?: number | null;
    points: number;
    category?: string;
    reason?: string;
    note?: string;
    recordedBy?: string;
  };

  if (!studentId || typeof points !== "number" || points === 0) {
    return Response.json({ error: "A student and non-zero point value are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(pointEvents)
    .values({
      studentId,
      sessionId: sessionId ?? null,
      points,
      category: category?.trim() || (points > 0 ? "General" : "Deduction"),
      reason: reason?.trim() || null,
      note: note?.trim() || null,
      recordedBy: recordedBy?.trim() || "Teacher",
    })
    .returning();

  return Response.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  await db.delete(pointEvents).where(eq(pointEvents.id, Number(id)));
  return Response.json({ ok: true });
}
