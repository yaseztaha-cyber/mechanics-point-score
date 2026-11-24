import { NextRequest } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getSessionsList } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getSessionsList();
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const date = body.date || new Date().toISOString().slice(0, 10);
  const title = (body.title ?? "").trim() || "Mechanics Session";

  const [{ max }] = (
    await db.execute(sql`select coalesce(max(session_number), 0) as max from sessions`)
  ) as { max: number }[];

  const [row] = await db
    .insert(sessions)
    .values({
      sessionNumber: Number(max) + 1,
      date,
      title,
      topic: body.topic?.trim() || null,
      startTime: body.startTime || null,
      endTime: body.endTime || null,
      status: "in_progress",
      notes: body.notes?.trim() || null,
    })
    .returning();

  return Response.json(row, { status: 201 });
}
