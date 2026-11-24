import { NextRequest } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStudentDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function getIdParam(params: Promise<{ id: string }>) {
  const { id } = await params;
  return Number(id);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await getIdParam(params);
  if (!id) return Response.json({ error: "Invalid student id" }, { status: 400 });
  const data = await getStudentDetail(id);
  if (!data) return Response.json({ error: "Student not found" }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await getIdParam(params);
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  for (const key of ["name", "studentCode", "className", "status", "email", "phone", "avatarColor"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates provided" }, { status: 400 });
  }
  const [row] = await db.update(students).set(updates).where(eq(students.id, id)).returning();
  if (!row) return Response.json({ error: "Student not found" }, { status: 404 });
  return Response.json(row);
}
