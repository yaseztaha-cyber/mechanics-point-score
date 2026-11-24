import { NextRequest } from "next/server";
import { db } from "@/db";
import { pointCategories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(pointCategories).orderBy(asc(pointCategories.sortOrder));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, defaultValue } = body as { name: string; type: string; defaultValue: number };
  if (!name?.trim() || !["positive", "negative"].includes(type)) {
    return Response.json({ error: "Name and valid type are required" }, { status: 400 });
  }
  const [row] = await db
    .insert(pointCategories)
    .values({ name: name.trim(), type, defaultValue: defaultValue ?? (type === "positive" ? 1 : -1) })
    .returning();
  return Response.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body as { id: number; [key: string]: unknown };
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const [row] = await db.update(pointCategories).set(rest).where(eq(pointCategories.id, id)).returning();
  return Response.json(row);
}
