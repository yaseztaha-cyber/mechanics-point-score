import { db } from "@/db";
import { students, sessions } from "@/db/schema";
import { sql } from "drizzle-orm";
import { PdfBuilder } from "@/lib/pdf";
import { signed } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const studentRows = (
    await db.execute(sql`
      select s.id, s.name, s.student_code as "studentCode",
        coalesce(a.present, 0) as present, coalesce(a.absent, 0) as absent,
        coalesce(a.late, 0) as late, coalesce(a.excused, 0) as excused,
        coalesce(p.net, 0) as "netPoints",
        coalesce(b.total, 0) as "behaviorTotal"
      from students s
      left join (
        select student_id,
          coalesce(sum(case when status = 'present' then 1 else 0 end), 0) as present,
          coalesce(sum(case when status = 'absent' then 1 else 0 end), 0) as absent,
          coalesce(sum(case when status = 'late' then 1 else 0 end), 0) as late,
          coalesce(sum(case when status = 'excused' then 1 else 0 end), 0) as excused
        from attendance_records group by student_id
      ) a on a.student_id = s.id
      left join (select student_id, sum(points) as net from point_events group by student_id) p on p.student_id = s.id
      left join (
        select student_id, count(*) as total from behavior_incidents where severity != 'positive' group by student_id
      ) b on b.student_id = s.id
      where s.status = 'active'
      order by "netPoints" desc nulls last
    `)
  ) as any[];

  const allSessions = await db.select().from(sessions);
  const [classTotals] = (
    await db.execute(sql`
      select
        coalesce(sum(case when status='present' then 1 else 0 end), 0) as present,
        coalesce(sum(case when status='absent' then 1 else 0 end), 0) as absent,
        coalesce(sum(case when status='late' then 1 else 0 end), 0) as late,
        coalesce(sum(case when status='excused' then 1 else 0 end), 0) as excused
      from attendance_records
    `)
  ) as any[];
  const [pointTotals] = (
    await db.execute(sql`
      select coalesce(sum(case when points>0 then points else 0 end), 0) as positive,
        coalesce(sum(case when points<0 then points else 0 end), 0) as negative
      from point_events
    `)
  ) as any[];
  const [behaviorTotals] = (
    await db.execute(sql`
      select count(*) as total,
        coalesce(sum(case when severity='positive' then 1 else 0 end), 0) as positive,
        coalesce(sum(case when severity='minor' then 1 else 0 end), 0) as minor,
        coalesce(sum(case when severity='moderate' then 1 else 0 end), 0) as moderate,
        coalesce(sum(case when severity='serious' then 1 else 0 end), 0) as serious
      from behavior_incidents
    `)
  ) as any[];

  const attention = (
    await db.execute(sql`
      with recent_sessions as (select id from sessions order by date desc limit 6)
      select s.name,
        (select count(*) from behavior_incidents bi where bi.student_id = s.id and bi.session_id in (select id from recent_sessions) and bi.severity != 'positive') as incidents,
        (select count(*) from attendance_records ar where ar.student_id = s.id and ar.session_id in (select id from recent_sessions) and ar.status = 'absent') as absences
      from students s where s.status = 'active'
    `)
  ).filter((r: any) => r.incidents >= 2 || r.absences >= 2) as any[];

  const pdf = await PdfBuilder.create("Class Report");
  pdf.heading("Mechanics — Class Performance Report");
  pdf.text(`Generated ${new Date().toLocaleString("en-US")}  ·  ${allSessions.length} sessions  ·  ${studentRows.length} active students`, 9);
  pdf.line();

  pdf.subheading("Class Summary");
  pdf.metricStrip([
    { label: "Present", value: String(classTotals.present) },
    { label: "Absent", value: String(classTotals.absent) },
    { label: "Late", value: String(classTotals.late) },
    { label: "Excused", value: String(classTotals.excused) },
  ]);
  pdf.metricStrip([
    { label: "Points +", value: signed(pointTotals.positive) },
    { label: "Points -", value: signed(pointTotals.negative) },
    { label: "Net Points", value: signed(pointTotals.positive + pointTotals.negative) },
    { label: "Behavior Incidents", value: String(behaviorTotals.total) },
  ]);
  pdf.line();

  pdf.subheading("Behavior Overview");
  pdf.metricStrip([
    { label: "Positive", value: String(behaviorTotals.positive) },
    { label: "Minor", value: String(behaviorTotals.minor) },
    { label: "Moderate", value: String(behaviorTotals.moderate) },
    { label: "Serious", value: String(behaviorTotals.serious) },
  ]);
  pdf.line();

  pdf.subheading("Student Rankings (by Net Points)");
  pdf.row(
    [
      { text: "Student", width: 170, bold: true },
      { text: "Attendance", width: 190, bold: true },
      { text: "Net Pts", width: 70, bold: true },
      { text: "Behavior", width: 80, bold: true },
    ],
    9.5,
  );
  for (const s of studentRows) {
    const valid = s.present + s.late + s.absent;
    const rate = valid > 0 ? `${Math.round(((s.present + s.late) / valid) * 1000) / 10}%` : "—";
    pdf.row([
      { text: s.name.slice(0, 26), width: 170 },
      { text: `P${s.present} A${s.absent} L${s.late} E${s.excused} (${rate})`, width: 190 },
      { text: signed(s.netPoints), width: 70 },
      { text: String(s.behaviorTotal), width: 80 },
    ]);
  }
  pdf.line();

  pdf.subheading("Students Requiring Attention (last 6 sessions)");
  if (attention.length === 0) {
    pdf.text("No students currently flagged — class trends look healthy.");
  }
  for (const r of attention) {
    pdf.text(`${r.name} — ${r.incidents} behavior incidents, ${r.absences} absences`, 9.5);
  }

  const bytes = await pdf.bytes();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mechanics_class_report.pdf"`,
    },
  });
}
