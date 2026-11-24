import { NextRequest } from "next/server";
import { db } from "@/db";
import { behaviorIncidents, pointEvents, students } from "@/db/schema";
import { and, desc, eq, gte, lte, ilike, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const conditions = [];
  const studentId = sp.get("studentId");
  const sessionId = sp.get("sessionId");
  const category = sp.get("category");
  const severity = sp.get("severity");
  const type = sp.get("type"); // positive | negative
  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  const q = sp.get("q");
  const hasPoints = sp.get("hasPoints");

  if (studentId) conditions.push(eq(behaviorIncidents.studentId, Number(studentId)));
  if (sessionId) conditions.push(eq(behaviorIncidents.sessionId, Number(sessionId)));
  if (category) conditions.push(eq(behaviorIncidents.category, category));
  if (severity) conditions.push(eq(behaviorIncidents.severity, severity));
  if (type === "positive") conditions.push(eq(behaviorIncidents.severity, "positive"));
  if (type === "negative") {
    conditions.push(
      or(
        eq(behaviorIncidents.severity, "minor"),
        eq(behaviorIncidents.severity, "moderate"),
        eq(behaviorIncidents.severity, "serious"),
      )!,
    );
  }
  if (dateFrom) conditions.push(gte(behaviorIncidents.createdAt, new Date(dateFrom).toISOString()));
  if (dateTo) conditions.push(lte(behaviorIncidents.createdAt, new Date(dateTo).toISOString()));
  if (q) conditions.push(or(ilike(students.name, `%${q}%`), ilike(behaviorIncidents.description, `%${q}%`))!);

  const rows = await db
    .select({
      id: behaviorIncidents.id,
      studentId: behaviorIncidents.studentId,
      studentName: students.name,
      sessionId: behaviorIncidents.sessionId,
      category: behaviorIncidents.category,
      severity: behaviorIncidents.severity,
      description: behaviorIncidents.description,
      relatedPoints: behaviorIncidents.relatedPoints,
      note: behaviorIncidents.note,
      status: behaviorIncidents.status,
      recordedBy: behaviorIncidents.recordedBy,
      createdAt: behaviorIncidents.createdAt,
    })
    .from(behaviorIncidents)
    .innerJoin(students, eq(students.id, behaviorIncidents.studentId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(behaviorIncidents.createdAt))
    .limit(500);

  const filtered = hasPoints === "true" ? rows.filter((r) => r.relatedPoints !== 0) : rows;

  return Response.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, sessionId, category, severity, description, relatedPoints, note, recordedBy } = body as {
    studentId: number;
    sessionId?: number | null;
    category: string;
    severity: string;
    description?: string;
    relatedPoints?: number;
    note?: string;
    recordedBy?: string;
  };

  if (!studentId || !category || !severity) {
    return Response.json({ error: "Student, category, and severity are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(behaviorIncidents)
    .values({
      studentId,
      sessionId: sessionId ?? null,
      category,
      severity,
      description: description?.trim() || null,
      relatedPoints: relatedPoints ?? 0,
      note: note?.trim() || null,
      recordedBy: recordedBy?.trim() || "Teacher",
    })
    .returning();

  let pointEventId: number | null = null;
  if (relatedPoints && relatedPoints !== 0) {
    const [pointRow] = await db
      .insert(pointEvents)
      .values({
        studentId,
        sessionId: sessionId ?? null,
        points: relatedPoints,
        category: "Behavior",
        reason: category,
        note: description?.trim() || null,
        recordedBy: recordedBy?.trim() || "Teacher",
      })
      .returning();
    pointEventId = pointRow.id;
  }

  return Response.json({ ...row, pointEventId }, { status: 201 });
}
