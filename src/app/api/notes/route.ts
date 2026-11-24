import { NextRequest } from "next/server";
import { db } from "@/db";
import { studentNotes, students } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const conditions = [];
  if (sp.get("studentId")) conditions.push(eq(studentNotes.studentId, Number(sp.get("studentId"))));
  if (sp.get("sessionId")) conditions.push(eq(studentNotes.sessionId, Number(sp.get("sessionId"))));
  if (sp.get("category")) conditions.push(eq(studentNotes.category, sp.get("category")!));

  const rows = await db
    .select({
      id: studentNotes.id,
      studentId: studentNotes.studentId,
      studentName: students.name,
      sessionId: studentNotes.sessionId,
      category: studentNotes.category,
      priority: studentNotes.priority,
      content: studentNotes.content,
      author: studentNotes.author,
      createdAt: studentNotes.createdAt,
    })
    .from(studentNotes)
    .innerJoin(students, eq(students.id, studentNotes.studentId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(studentNotes.createdAt))
    .limit(300);

  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, sessionId, category, priority, content, author } = body as {
    studentId: number;
    sessionId?: number | null;
    category?: string;
    priority?: string;
    content: string;
    author?: string;
  };
  if (!studentId || !content?.trim()) {
    return Response.json({ error: "Student and note content are required" }, { status: 400 });
  }
  const [row] = await db
    .insert(studentNotes)
    .values({
      studentId,
      sessionId: sessionId ?? null,
      category: category || "General",
      priority: priority || "normal",
      content: content.trim(),
      author: author?.trim() || "Teacher",
    })
    .returning();
  return Response.json(row, { status: 201 });
}
