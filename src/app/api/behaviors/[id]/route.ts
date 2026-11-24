import { NextRequest } from "next/server";
import { db } from "@/db";
import { behaviorIncidents, pointEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of ["category", "severity", "description", "relatedPoints", "note", "status"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  const [row] = await db
    .update(behaviorIncidents)
    .set(updates)
    .where(eq(behaviorIncidents.id, Number(id)))
    .returning();
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pointEventId = req.nextUrl.searchParams.get("pointEventId");
  await db.delete(behaviorIncidents).where(eq(behaviorIncidents.id, Number(id)));
  if (pointEventId) {
    await db.delete(pointEvents).where(eq(pointEvents.id, Number(pointEventId)));
  }
  return Response.json({ ok: true });
}
