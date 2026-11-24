import { NextRequest } from "next/server";
import { db } from "@/db";
import { behaviorCategories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(behaviorCategories).orderBy(asc(behaviorCategories.sortOrder));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, defaultSeverity } = body as { name: string; type: string; defaultSeverity: string };
  if (!name?.trim() || !["positive", "negative"].includes(type)) {
    return Response.json({ error: "Name and valid type are required" }, { status: 400 });
  }
  const [row] = await db
    .insert(behaviorCategories)
    .values({
      name: name.trim(),
      type,
      defaultSeverity: defaultSeverity || (type === "positive" ? "positive" : "minor"),
    })
    .returning();
  return Response.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...rest } = body as { id: number; [key: string]: unknown };
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const [row] = await db.update(behaviorCategories).set(rest).where(eq(behaviorCategories.id, id)).returning();
  return Response.json(row);
}
