import { NextRequest } from "next/server";
import { db } from "@/db";
import { students, attendanceRecords, pointEvents, behaviorIncidents, studentNotes, sessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { attendanceStats, pointStats, behaviorStats } from "@/lib/analytics";
import { PdfBuilder } from "@/lib/pdf";
import { signed } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const studentId = Number(id);
  const [student] = await db.select().from(students).where(eq(students.id, studentId));
  if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

  const attendance = await db.select().from(attendanceRecords).where(eq(attendanceRecords.studentId, studentId));
  const points = await db
    .select()
    .from(pointEvents)
    .where(eq(pointEvents.studentId, studentId))
    .orderBy(desc(pointEvents.createdAt));
  const behaviors = await db
    .select()
    .from(behaviorIncidents)
    .where(eq(behaviorIncidents.studentId, studentId))
    .orderBy(desc(behaviorIncidents.createdAt));
  const notes = await db
    .select()
    .from(studentNotes)
    .where(eq(studentNotes.studentId, studentId))
    .orderBy(desc(studentNotes.createdAt));
  const allSessions = await db.select().from(sessions);
  const sessionMap = new Map(allSessions.map((s) => [s.id, s]));

  const marked = attendance.filter((a) => a.status !== "unmarked");
  const aStats = attendanceStats(marked.map((a) => ({ status: a.status as any, sessionId: a.sessionId })));
  const pStats = pointStats(points.map((p) => ({ points: p.points, sessionId: p.sessionId, createdAt: p.createdAt as any })));
  const bStats = behaviorStats(
    behaviors.map((b) => ({ severity: b.severity as any, category: b.category, sessionId: b.sessionId, createdAt: b.createdAt as any })),
  );

  const pdf = await PdfBuilder.create(student.name);
  pdf.heading("Mechanics — Student Performance Report");
  pdf.text(`Generated ${new Date().toLocaleString("en-US")}`, 9);
  pdf.spacer(6);
  pdf.subheading(`${student.name}  ·  ${student.studentCode}  ·  ${student.className}`);
  pdf.line();

  pdf.subheading("Attendance Overview");
  pdf.metricStrip([
    { label: "Attendance Rate", value: `${aStats.rate}%` },
    { label: "Present", value: String(aStats.present) },
    { label: "Late", value: String(aStats.late) },
    { label: "Excused", value: String(aStats.excused) },
    { label: "Absent", value: String(aStats.absent) },
  ]);

  pdf.subheading("Points Overview");
  pdf.metricStrip([
    { label: "Positive", value: signed(pStats.positive) },
    { label: "Negative", value: signed(pStats.negative) },
    { label: "Net Points", value: signed(pStats.net) },
    { label: "Avg / Session", value: signed(pStats.average) },
    { label: "Sessions Scored", value: String(pStats.sessionsCount) },
  ]);

  pdf.subheading("Behavior Overview");
  pdf.metricStrip([
    { label: "Total Incidents", value: String(bStats.total) },
    { label: "Minor", value: String(bStats.minor) },
    { label: "Moderate", value: String(bStats.moderate) },
    { label: "Serious", value: String(bStats.serious) },
    { label: "Positive", value: String(bStats.positive) },
  ]);
  pdf.line();

  pdf.subheading("Session Attendance History");
  pdf.row(
    [
      { text: "Date", width: 90, bold: true },
      { text: "Session", width: 260, bold: true },
      { text: "Status", width: 100, bold: true },
    ],
    9.5,
  );
  for (const a of marked.slice(0, 40)) {
    const s = sessionMap.get(a.sessionId);
    pdf.row([
      { text: s ? String(s.date) : "—", width: 90 },
      { text: s ? `S${s.sessionNumber} · ${s.title}`.slice(0, 44) : "—", width: 260 },
      { text: a.status, width: 100 },
    ]);
  }
  pdf.line();

  pdf.subheading("Point Event History");
  pdf.row(
    [
      { text: "Date", width: 90, bold: true },
      { text: "Category / Reason", width: 280, bold: true },
      { text: "Points", width: 80, bold: true },
    ],
    9.5,
  );
  for (const p of points.slice(0, 40)) {
    pdf.row([
      { text: new Date(p.createdAt as unknown as string).toLocaleDateString("en-US"), width: 90 },
      { text: `${p.category}${p.reason ? " — " + p.reason : ""}`.slice(0, 48), width: 280 },
      { text: signed(p.points), width: 80 },
    ]);
  }
  pdf.line();

  pdf.subheading("Behavior Incidents");
  if (behaviors.length === 0) {
    pdf.text("No behavior incidents recorded.");
  }
  for (const b of behaviors.slice(0, 30)) {
    pdf.row([
      { text: new Date(b.createdAt as unknown as string).toLocaleDateString("en-US"), width: 90, bold: true },
      { text: `${b.category} (${b.severity})`, width: 280 },
      { text: b.relatedPoints ? signed(b.relatedPoints) : "—", width: 80 },
    ]);
    if (b.description) pdf.text(b.description.slice(0, 110), 9);
  }
  pdf.line();

  pdf.subheading("Notes");
  if (notes.length === 0) {
    pdf.text("No notes recorded.");
  }
  for (const n of notes.slice(0, 30)) {
    pdf.text(
      `${new Date(n.createdAt as unknown as string).toLocaleDateString("en-US")} · [${n.category}] ${n.content}`.slice(0, 110),
      9,
    );
  }

  const bytes = await pdf.bytes();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${student.name.replace(/\s+/g, "_")}_report.pdf"`,
    },
  });
}
