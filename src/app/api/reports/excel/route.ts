import ExcelJS from "exceljs";
import { db } from "@/db";
import {
  students,
  sessions,
  attendanceRecords,
  pointEvents,
  behaviorIncidents,
  studentNotes,
} from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function headerRow(sheet: ExcelJS.Worksheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8ECF3" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

export async function GET() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Mechanics Attendance System";
  wb.created = new Date();

  const allStudents = await db.select().from(students);
  const allSessions = await db.select().from(sessions);
  const allAttendance = await db
    .select({
      studentId: attendanceRecords.studentId,
      sessionId: attendanceRecords.sessionId,
      status: attendanceRecords.status,
      note: attendanceRecords.note,
      updatedAt: attendanceRecords.updatedAt,
    })
    .from(attendanceRecords);
  const allPoints = await db.select().from(pointEvents);
  const allBehaviors = await db.select().from(behaviorIncidents);
  const allNotes = await db.select().from(studentNotes);

  const studentMap = new Map(allStudents.map((s) => [s.id, s]));
  const sessionMap = new Map(allSessions.map((s) => [s.id, s]));

  // Students sheet
  const sStudents = wb.addWorksheet("Students");
  sStudents.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Student Code", key: "code", width: 16 },
    { header: "Name", key: "name", width: 26 },
    { header: "Class", key: "class", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Email", key: "email", width: 24 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Created", key: "created", width: 20 },
  ];
  allStudents.forEach((s) =>
    sStudents.addRow({
      id: s.id,
      code: s.studentCode,
      name: s.name,
      class: s.className,
      status: s.status,
      email: s.email,
      phone: s.phone,
      created: new Date(s.createdAt as unknown as string).toLocaleString("en-US"),
    }),
  );
  headerRow(sStudents);

  // Sessions sheet
  const sSessions = wb.addWorksheet("Sessions");
  sSessions.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Session #", key: "num", width: 10 },
    { header: "Date", key: "date", width: 14 },
    { header: "Title", key: "title", width: 30 },
    { header: "Topic", key: "topic", width: 30 },
    { header: "Status", key: "status", width: 14 },
  ];
  allSessions.forEach((s) =>
    sSessions.addRow({ id: s.id, num: s.sessionNumber, date: String(s.date), title: s.title, topic: s.topic, status: s.status }),
  );
  headerRow(sSessions);

  // Attendance sheet
  const sAttendance = wb.addWorksheet("Attendance");
  sAttendance.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Session", key: "session", width: 26 },
    { header: "Student", key: "student", width: 24 },
    { header: "Status", key: "status", width: 12 },
    { header: "Note", key: "note", width: 30 },
  ];
  [...allAttendance]
    .sort((x, y) => {
      const dx = String(sessionMap.get(x.sessionId)?.date ?? "");
      const dy = String(sessionMap.get(y.sessionId)?.date ?? "");
      if (dx !== dy) return dx < dy ? -1 : 1;
      return (studentMap.get(x.studentId)?.name ?? "").localeCompare(studentMap.get(y.studentId)?.name ?? "");
    })
    .forEach((a) => {
      const session = sessionMap.get(a.sessionId);
      sAttendance.addRow({
        date: session ? String(session.date) : "",
        session: session ? `S${session.sessionNumber} · ${session.title}` : "",
        student: studentMap.get(a.studentId)?.name ?? "",
        status: a.status,
        note: a.note ?? "",
      });
    });
  headerRow(sAttendance);

  // Points sheet
  const sPoints = wb.addWorksheet("Points");
  sPoints.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Session", key: "session", width: 26 },
    { header: "Student", key: "student", width: 24 },
    { header: "Points", key: "points", width: 10 },
    { header: "Category", key: "category", width: 16 },
    { header: "Reason", key: "reason", width: 26 },
    { header: "Note", key: "note", width: 30 },
    { header: "Recorded By", key: "by", width: 16 },
  ];
  allPoints.forEach((p) => {
    const session = p.sessionId ? sessionMap.get(p.sessionId) : null;
    sPoints.addRow({
      date: new Date(p.createdAt as unknown as string).toLocaleString("en-US"),
      session: session ? `S${session.sessionNumber} · ${session.title}` : "",
      student: studentMap.get(p.studentId)?.name ?? "",
      points: p.points,
      category: p.category,
      reason: p.reason ?? "",
      note: p.note ?? "",
      by: p.recordedBy,
    });
  });
  headerRow(sPoints);

  // Behaviors sheet
  const sBehaviors = wb.addWorksheet("Behaviors");
  sBehaviors.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Session", key: "session", width: 26 },
    { header: "Student", key: "student", width: 24 },
    { header: "Behavior", key: "behavior", width: 20 },
    { header: "Severity", key: "severity", width: 12 },
    { header: "Description", key: "description", width: 36 },
    { header: "Related Points", key: "points", width: 14 },
    { header: "Timestamp", key: "timestamp", width: 20 },
  ];
  allBehaviors.forEach((b) => {
    const session = b.sessionId ? sessionMap.get(b.sessionId) : null;
    sBehaviors.addRow({
      date: session ? String(session.date) : new Date(b.createdAt as unknown as string).toLocaleDateString("en-US"),
      session: session ? `S${session.sessionNumber} · ${session.title}` : "",
      student: studentMap.get(b.studentId)?.name ?? "",
      behavior: b.category,
      severity: b.severity,
      description: b.description ?? "",
      points: b.relatedPoints,
      timestamp: new Date(b.createdAt as unknown as string).toLocaleString("en-US"),
    });
  });
  headerRow(sBehaviors);

  // Notes sheet
  const sNotes = wb.addWorksheet("Notes");
  sNotes.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Student", key: "student", width: 24 },
    { header: "Category", key: "category", width: 16 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Content", key: "content", width: 46 },
    { header: "Author", key: "author", width: 16 },
  ];
  allNotes.forEach((n) =>
    sNotes.addRow({
      date: new Date(n.createdAt as unknown as string).toLocaleString("en-US"),
      student: studentMap.get(n.studentId)?.name ?? "",
      category: n.category,
      priority: n.priority,
      content: n.content,
      author: n.author,
    }),
  );
  headerRow(sNotes);

  // Student Summary sheet
  const summaryRows = (
    await db.execute(sql`
      select s.name, s.student_code as code, s.status,
        coalesce(a.present,0) as present, coalesce(a.absent,0) as absent,
        coalesce(a.late,0) as late, coalesce(a.excused,0) as excused,
        coalesce(a.unmarked,0) as unmarked,
        coalesce(p.positive,0) as points_positive, coalesce(p.negative,0) as points_negative,
        coalesce(b.total,0) as behavior_total
      from students s
      left join (
        select student_id,
          coalesce(sum(case when status='present' then 1 else 0 end), 0) as present,
          coalesce(sum(case when status='absent' then 1 else 0 end), 0) as absent,
          coalesce(sum(case when status='late' then 1 else 0 end), 0) as late,
          coalesce(sum(case when status='excused' then 1 else 0 end), 0) as excused,
          coalesce(sum(case when status='unmarked' then 1 else 0 end), 0) as unmarked
        from attendance_records group by student_id
      ) a on a.student_id = s.id
      left join (
        select student_id, coalesce(sum(case when points>0 then points else 0 end), 0) as positive, coalesce(sum(case when points<0 then points else 0 end), 0) as negative
        from point_events group by student_id
      ) p on p.student_id = s.id
      left join (select student_id, count(*) as total from behavior_incidents group by student_id) b on b.student_id = s.id
      order by s.name
    `)
  ) as any[];
  const sSummary = wb.addWorksheet("Student Summary");
  sSummary.columns = [
    { header: "Student", key: "name", width: 24 },
    { header: "Code", key: "code", width: 14 },
    { header: "Status", key: "status", width: 10 },
    { header: "Present", key: "present", width: 10 },
    { header: "Absent", key: "absent", width: 10 },
    { header: "Late", key: "late", width: 10 },
    { header: "Excused", key: "excused", width: 10 },
    { header: "Unmarked", key: "unmarked", width: 10 },
    { header: "Attendance Rate %", key: "rate", width: 16 },
    { header: "Points +", key: "pp", width: 10 },
    { header: "Points -", key: "pn", width: 10 },
    { header: "Net", key: "net", width: 10 },
    { header: "Behavior Incidents", key: "beh", width: 18 },
  ];
  summaryRows.forEach((r) => {
    // Same definition as the app: (present + late) / (present + late + absent), excused neutral.
    const valid = r.present + r.late + r.absent;
    const rate = valid > 0 ? Math.round(((r.present + r.late) / valid) * 1000) / 10 : 0;
    sSummary.addRow({
      name: r.name,
      code: r.code,
      status: r.status,
      present: r.present,
      absent: r.absent,
      late: r.late,
      excused: r.excused,
      unmarked: r.unmarked,
      rate,
      pp: r.points_positive,
      pn: r.points_negative,
      net: r.points_positive + r.points_negative,
      beh: r.behavior_total,
    });
  });
  headerRow(sSummary);

  // Session Summary sheet
  const sessionSummaryRows = (
    await db.execute(sql`
      select se.session_number as num, se.date, se.title, se.status,
        coalesce(a.present,0) as present, coalesce(a.absent,0) as absent,
        coalesce(a.late,0) as late, coalesce(a.excused,0) as excused,
        coalesce(a.unmarked,0) as unmarked,
        coalesce(p.positive,0) as points_positive, coalesce(p.negative,0) as points_negative,
        coalesce(b.total,0) as behavior_total
      from sessions se
      left join (
        select session_id,
          coalesce(sum(case when status='present' then 1 else 0 end), 0) as present,
          coalesce(sum(case when status='absent' then 1 else 0 end), 0) as absent,
          coalesce(sum(case when status='late' then 1 else 0 end), 0) as late,
          coalesce(sum(case when status='excused' then 1 else 0 end), 0) as excused,
          coalesce(sum(case when status='unmarked' then 1 else 0 end), 0) as unmarked
        from attendance_records group by session_id
      ) a on a.session_id = se.id
      left join (
        select session_id, coalesce(sum(case when points>0 then points else 0 end), 0) as positive, coalesce(sum(case when points<0 then points else 0 end), 0) as negative
        from point_events group by session_id
      ) p on p.session_id = se.id
      left join (select session_id, count(*) as total from behavior_incidents group by session_id) b on b.session_id = se.id
      order by se.date
    `)
  ) as any[];
  const sSessionSummary = wb.addWorksheet("Session Summary");
  sSessionSummary.columns = [
    { header: "Session #", key: "num", width: 10 },
    { header: "Date", key: "date", width: 14 },
    { header: "Title", key: "title", width: 30 },
    { header: "Status", key: "status", width: 12 },
    { header: "Present", key: "present", width: 10 },
    { header: "Absent", key: "absent", width: 10 },
    { header: "Late", key: "late", width: 10 },
    { header: "Excused", key: "excused", width: 10 },
    { header: "Unmarked", key: "unmarked", width: 10 },
    { header: "Total Students", key: "total", width: 14 },
    { header: "Points +", key: "pp", width: 10 },
    { header: "Points -", key: "pn", width: 10 },
    { header: "Net", key: "net", width: 10 },
    { header: "Behavior", key: "beh", width: 10 },
  ];
  sessionSummaryRows.forEach((r) =>
    sSessionSummary.addRow({
      num: r.num,
      date: String(r.date),
      title: r.title,
      status: r.status,
      present: r.present,
      absent: r.absent,
      late: r.late,
      excused: r.excused,
      unmarked: r.unmarked,
      total: r.present + r.absent + r.late + r.excused + r.unmarked,
      pp: r.points_positive,
      pn: r.points_negative,
      net: r.points_positive + r.points_negative,
      beh: r.behavior_total,
    }),
  );
  headerRow(sSessionSummary);

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mechanics_full_report.xlsx"`,
    },
  });
}
