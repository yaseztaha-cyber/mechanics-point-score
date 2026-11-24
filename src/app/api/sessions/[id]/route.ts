import { NextRequest } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function getIdParam(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await getIdParam(params);
  const data = await getSessionDetail(id);
  if (!data) return Response.json({ error: "Session not found" }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await getIdParam(params);
  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of ["title", "topic", "status", "notes", "startTime", "endTime", "date"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  const [row] = await db.update(sessions).set(updates).where(eq(sessions.id, id)).returning();
  if (!row) return Response.json({ error: "Session not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await getIdParam(params);
  // Attendance, points, behaviors, and notes for this session are removed
  // automatically via ON DELETE CASCADE foreign keys.
  const [row] = await db.delete(sessions).where(eq(sessions.id, id)).returning({ id: sessions.id });
  if (!row) return Response.json({ error: "Session not found" }, { status: 404 });
  return Response.json({ ok: true });
}
