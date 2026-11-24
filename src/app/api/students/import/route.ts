import { NextRequest } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#dc2626", "#4f46e5"];

interface ImportRow {
  studentCode?: string;
  name?: string;
  className?: string;
  email?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows: ImportRow[] = body.rows ?? [];
  const commit: boolean = Boolean(body.commit);

  const existingCodes = new Set(
    (await db.select({ code: students.studentCode }).from(students)).map((r) => r.code),
  );

  const seenCodes = new Set<string>();
  const seenNames = new Set<string>();
  const results = rows.map((row, idx) => {
    const issues: string[] = [];
    const name = (row.name ?? "").trim();
    const code = (row.studentCode ?? "").trim() || `IMP-${Date.now()}-${idx}`;
    if (!name) issues.push("Missing name");
    if (existingCodes.has(code)) issues.push("Duplicate of existing student ID");
    if (seenCodes.has(code)) issues.push("Duplicate student ID in file");
    if (seenNames.has(name.toLowerCase())) issues.push("Duplicate name in file");
    seenCodes.add(code);
    if (name) seenNames.add(name.toLowerCase());
    return {
      row: idx + 1,
      studentCode: code,
      name,
      className: row.className?.trim() || "Mechanics",
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      valid: issues.length === 0,
      issues,
    };
  });

  if (!commit) {
    return Response.json({
      preview: results,
      validCount: results.filter((r) => r.valid).length,
      invalidCount: results.filter((r) => !r.valid).length,
    });
  }

  const toInsert = results.filter((r) => r.valid);
  if (toInsert.length > 0) {
    await db.insert(students).values(
      toInsert.map((r) => ({
        studentCode: r.studentCode,
        name: r.name,
        className: r.className,
        email: r.email,
        phone: r.phone,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      })),
    );
  }

  return Response.json({ imported: toInsert.length, skipped: results.length - toInsert.length });
}
