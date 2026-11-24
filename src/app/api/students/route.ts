import { NextRequest } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getStudentsList } from "@/lib/queries";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#dc2626", "#4f46e5"];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const status = req.nextUrl.searchParams.get("status");
  const rows = await getStudentsList(q, status);
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) {
    return Response.json({ error: "Student name is required" }, { status: 400 });
  }
  const studentCode = (body.studentCode ?? "").trim() || `STU-${Date.now().toString().slice(-6)}`;

  const existing = await db.execute(
    sql`select id from students where student_code = ${studentCode} limit 1`,
  );
  if (existing.length > 0) {
    return Response.json({ error: "A student with this ID already exists" }, { status: 409 });
  }

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const [row] = await db
    .insert(students)
    .values({
      studentCode,
      name,
      className: body.className?.trim() || "Mechanics",
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      avatarColor: color,
    })
    .returning();

  return Response.json(row, { status: 201 });
}
