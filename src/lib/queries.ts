import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function getDashboardData() {
  const today = new Date().toISOString().slice(0, 10);

  const [todaySession] = await db.execute(sql`
    select id, session_number as "sessionNumber", date, title, topic, status
    from sessions where date = ${today} order by session_number desc limit 1
  `);

  let todayStats = null;
  if (todaySession) {
    const [att] = await db.execute(sql`
      select
        coalesce(sum(case when status = 'present' then 1 else 0 end), 0) as present,
        coalesce(sum(case when status = 'absent' then 1 else 0 end), 0) as absent,
        coalesce(sum(case when status = 'late' then 1 else 0 end), 0) as late,
        coalesce(sum(case when status = 'excused' then 1 else 0 end), 0) as excused
      from attendance_records where session_id = ${todaySession.id}
    `);
    const [pts] = await db.execute(sql`
      select
        coalesce(sum(case when points > 0 then points else 0 end), 0) as positive,
        coalesce(sum(case when points < 0 then points else 0 end), 0) as negative
      from point_events where session_id = ${todaySession.id}
    `);
    const [beh] = await db.execute(sql`select count(*) as total from behavior_incidents where session_id = ${todaySession.id}`);
    todayStats = {
      present: Number(att.present),
      absent: Number(att.absent),
      late: Number(att.late),
      excused: Number(att.excused),
      pointsPositive: Number(pts.positive),
      pointsNegative: Number(pts.negative),
      behaviorTotal: Number(beh.total),
    };
  }

  const [classTotals] = await db.execute(sql`select count(*) as total from students where status = 'active'`);
  const [sessionTotals] = await db.execute(sql`select count(*) as total from sessions`);

  const [attendanceRate] = await db.execute(sql`
    select
      coalesce(sum(case when status in ('present','late') then 1 else 0 end), 0) as attended,
      coalesce(sum(case when status in ('present','late','absent') then 1 else 0 end), 0) as valid
    from attendance_records
  `);
  const rate =
    Number(attendanceRate.valid) > 0
      ? Math.round((Number(attendanceRate.attended) / Number(attendanceRate.valid)) * 1000) / 10
      : 0;

  const recentActivity = await db.execute(sql`
    select 'attendance' as kind, ar.id, s.name as student_name, ar.status as detail, null as points,
      ar.updated_at as ts
    from attendance_records ar join students s on s.id = ar.student_id
    where ar.status != 'unmarked'
    union all
    select 'point' as kind, pe.id, s.name as student_name, pe.reason as detail, pe.points,
      pe.created_at as ts
    from point_events pe join students s on s.id = pe.student_id
    union all
    select 'behavior' as kind, bi.id, s.name as student_name, bi.category as detail, bi.related_points as points,
      bi.created_at as ts
    from behavior_incidents bi join students s on s.id = bi.student_id
    order by ts desc limit 10
  `);

  const alerts: { type: string; message: string }[] = [];

  const absenceAlert = await db.execute(sql`
    with recent_sessions as (select id from sessions order by date desc limit 8)
    select s.name, count(*) as absences
    from attendance_records ar
    join students s on s.id = ar.student_id
    where ar.session_id in (select id from recent_sessions) and ar.status = 'absent'
    group by s.name having count(*) >= 3
    order by absences desc limit 5
  `);
  for (const row of absenceAlert) {
    alerts.push({ type: "attendance", message: `${row.name} has ${row.absences} absences in the last 8 sessions` });
  }

  const behaviorAlert = await db.execute(sql`
    with recent_sessions as (select id from sessions order by date desc limit 6)
    select s.name, count(*) as incidents
    from behavior_incidents bi
    join students s on s.id = bi.student_id
    where bi.session_id in (select id from recent_sessions) and bi.severity != 'positive'
    group by s.name having count(*) >= 3
    order by incidents desc limit 5
  `);
  for (const row of behaviorAlert) {
    alerts.push({
      type: "behavior",
      message: `${row.name} has ${row.incidents} behavior incidents across the last 6 sessions — follow-up recommended`,
    });
  }

  const pointsAlert = await db.execute(sql`
    select s.name, count(distinct bi.session_id) as c
    from behavior_incidents bi join students s on s.id = bi.student_id
    where bi.severity = 'positive'
    group by s.name
  `);

  return {
    date: today,
    todaySession: todaySession ?? null,
    todayStats,
    totals: {
      students: Number(classTotals.total),
      sessions: Number(sessionTotals.total),
      attendanceRate: rate,
    },
    recentActivity,
    alerts,
    _unused: pointsAlert.length,
  };
}

export async function getBehaviorDashboardData() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = thisMonthStart;

  const [totals] = await db.execute(sql`
    select
      count(*) as total,
      coalesce(sum(case when severity = 'positive' then 1 else 0 end), 0) as positive,
      coalesce(sum(case when severity = 'minor' then 1 else 0 end), 0) as minor,
      coalesce(sum(case when severity = 'moderate' then 1 else 0 end), 0) as moderate,
      coalesce(sum(case when severity = 'serious' then 1 else 0 end), 0) as serious
    from behavior_incidents
  `);

  const [thisMonth] = await db.execute(
    sql`select count(*) as c from behavior_incidents where created_at >= ${thisMonthStart} and severity != 'positive'`,
  );
  const [lastMonth] = await db.execute(
    sql`select count(*) as c from behavior_incidents where created_at >= ${lastMonthStart} and created_at < ${lastMonthEnd} and severity != 'positive'`,
  );

  const categories = await db.execute(sql`
    select category, count(*) as count, severity
    from behavior_incidents group by category, severity order by count desc
  `);
  const categoryTotals = new Map<string, number>();
  for (const c of categories) categoryTotals.set(c.category, (categoryTotals.get(c.category) ?? 0) + c.count);
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }));

  const repeatedStudents = await db.execute(sql`
    with recent_sessions as (select id from sessions order by date desc limit 6)
    select s.id, s.name, count(*) as incidents
    from behavior_incidents bi
    join students s on s.id = bi.student_id
    where bi.session_id in (select id from recent_sessions) and bi.severity != 'positive'
    group by s.id, s.name having count(*) >= 2
    order by incidents desc limit 10
  `);

  const recent = await db.execute(sql`
    select bi.id, s.id as "studentId", s.name as "studentName", bi.category, bi.severity,
      bi.description, bi.related_points as "relatedPoints", bi.created_at as "createdAt",
      bi.status, se.title as "sessionTitle"
    from behavior_incidents bi
    join students s on s.id = bi.student_id
    left join sessions se on se.id = bi.session_id
    order by bi.created_at desc limit 20
  `);

  return {
    totals: totals ?? { total: 0, positive: 0, minor: 0, moderate: 0, serious: 0 },
    trend: { thisMonth: thisMonth.c, lastMonth: lastMonth.c },
    topCategories,
    repeatedStudents,
    recent,
  };
}

export async function getStudentsList(q?: string, status?: string | null) {
  const result = await db.execute(sql`
    select s.id, s.student_code as "studentCode", s.name, s.class_name as "className",
      s.status, s.email, s.phone, s.avatar_color as "avatarColor", s.created_at as "createdAt",
      coalesce(a.present, 0) as present, coalesce(a.absent, 0) as absent,
      coalesce(a.late, 0) as late, coalesce(a.excused, 0) as excused,
      coalesce(p.net, 0) as "netPoints",
      coalesce(b.total, 0) as "behaviorTotal",
      coalesce(b.positive, 0) as "positiveBehavior"
    from students s
    left join (
      select student_id,
        coalesce(sum(case when status = 'present' then 1 else 0 end), 0) as present,
        coalesce(sum(case when status = 'absent' then 1 else 0 end), 0) as absent,
        coalesce(sum(case when status = 'late' then 1 else 0 end), 0) as late,
        coalesce(sum(case when status = 'excused' then 1 else 0 end), 0) as excused
      from attendance_records group by student_id
    ) a on a.student_id = s.id
    left join (
      select student_id, sum(points) as net from point_events group by student_id
    ) p on p.student_id = s.id
    left join (
      select student_id,
        coalesce(sum(case when severity != 'positive' then 1 else 0 end), 0) as total,
        coalesce(sum(case when severity = 'positive' then 1 else 0 end), 0) as positive
      from behavior_incidents group by student_id
    ) b on b.student_id = s.id
    where (${q ? sql`(s.name like ${"%" + q + "%"} or s.student_code like ${"%" + q + "%"})` : sql`true`})
      and (${status ? sql`s.status = ${status}` : sql`true`})
    order by s.name asc
  `);
  return result;
}

export async function getStudentDetail(id: number) {
  const [student] = await db.execute(sql`select * from students where id = ${id}`);
  if (!student) return null;

  const attendance = await db.execute(sql`select id, status, session_id as "sessionId", note, updated_at as "updatedAt" from attendance_records where student_id = ${id}`);
  const points = await db.execute(sql`select * from point_events where student_id = ${id} order by created_at desc`);
  const behaviors = await db.execute(sql`select * from behavior_incidents where student_id = ${id} order by created_at desc`);
  const notes = await db.execute(sql`select * from student_notes where student_id = ${id} order by created_at desc`);

  const sessionIds = Array.from(
    new Set([
      ...attendance.map((a) => a.sessionId),
      ...points.map((p) => p.session_id).filter((x) => x != null),
      ...behaviors.map((b) => b.session_id).filter((x) => x != null),
    ]),
  );
  const sessionRows = sessionIds.length
    ? await db.execute(sql`select * from sessions where id in (${sessionIds.join(",")})`)
    : [];
  const sessionMap = new Map(sessionRows.map((s) => [s.id, s]));

  const markedAttendance = attendance.filter((a) => a.status !== "unmarked");

  const { attendanceStats, pointStats, behaviorStats } = await import("./analytics");
  const aStats = attendanceStats(markedAttendance.map((a) => ({ status: a.status, sessionId: a.sessionId })));
  const pStats = pointStats(points.map((p) => ({ points: p.points, sessionId: p.session_id, createdAt: p.created_at })));
  const bStats = behaviorStats(
    behaviors.map((b) => ({ severity: b.severity, category: b.category, sessionId: b.session_id, createdAt: b.created_at })),
  );

  type TimelineItem = {
    kind: "attendance" | "point" | "behavior" | "note";
    timestamp: string;
    sessionId: number | null;
    sessionTitle: string | null;
    data: Record<string, unknown>;
  };
  const timeline: TimelineItem[] = [];
  for (const a of markedAttendance) {
    timeline.push({
      kind: "attendance",
      timestamp: a.updatedAt,
      sessionId: a.sessionId,
      sessionTitle: sessionMap.get(a.sessionId)?.title ?? null,
      data: { status: a.status, note: a.note },
    });
  }
  for (const p of points) {
    timeline.push({
      kind: "point",
      timestamp: p.created_at,
      sessionId: p.session_id,
      sessionTitle: p.session_id ? sessionMap.get(p.session_id)?.title ?? null : null,
      data: { points: p.points, category: p.category, reason: p.reason, note: p.note, id: p.id },
    });
  }
  for (const b of behaviors) {
    timeline.push({
      kind: "behavior",
      timestamp: b.updated_at,
      sessionId: b.session_id,
      sessionTitle: b.session_id ? sessionMap.get(b.session_id)?.title ?? null : null,
      data: {
        category: b.category,
        severity: b.severity,
        description: b.description,
        relatedPoints: b.related_points,
        note: b.note,
        id: b.id,
      },
    });
  }
  for (const n of notes) {
    timeline.push({
      kind: "note",
      timestamp: n.created_at,
      sessionId: n.session_id,
      sessionTitle: n.session_id ? sessionMap.get(n.session_id)?.title ?? null : null,
      data: { content: n.content, category: n.category, priority: n.priority, author: n.author, id: n.id },
    });
  }
  timeline.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());

  const sessionsWithPoints = sessionRows
    .filter((s) => points.some((p) => p.session_id === s.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;
  const chart = sessionsWithPoints.map((s) => {
    const total = points.filter((p) => p.session_id === s.id).reduce((acc, p) => acc + p.points, 0);
    cumulative += total;
    return { sessionId: s.id, sessionNumber: s.session_number, label: `S${s.session_number}`, total, cumulative };
  });

  return {
    student,
    stats: { attendance: aStats, points: pStats, behavior: bStats },
    timeline: timeline.slice(0, 150),
    chart,
    notes,
    behaviors,
    points,
  };
}

export async function getSessionDetail(id: number) {
  const [session] = await db.execute(sql`select * from sessions where id = ${id}`);
  if (!session) return null;

  const attendance = await db.execute(sql`
    select ar.status, ar.student_id as "studentId", s.name as "studentName"
    from attendance_records ar join students s on s.id = ar.student_id
    where ar.session_id = ${id}
  `);

  const points = await db.execute(sql`
    select pe.id, pe.student_id as "studentId", s.name as "studentName", pe.points, pe.category,
      pe.reason, pe.note, pe.created_at as "createdAt"
    from point_events pe join students s on s.id = pe.student_id
    where pe.session_id = ${id} order by pe.created_at desc
  `);

  const behaviors = await db.execute(sql`
    select bi.id, bi.student_id as "studentId", s.name as "studentName", bi.category, bi.severity,
      bi.description, bi.related_points as "relatedPoints", bi.created_at as "createdAt"
    from behavior_incidents bi join students s on s.id = bi.student_id
    where bi.session_id = ${id} order by bi.created_at desc
  `);

  const totalsByStudent = new Map<number, number>();
  for (const p of points) totalsByStudent.set(p.studentId, (totalsByStudent.get(p.studentId) ?? 0) + p.points);
  const topParticipation = Array.from(totalsByStudent.entries())
    .map(([studentId, total]) => ({ studentId, total, name: points.find((p) => p.studentId === studentId)?.studentName ?? "" }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const summary = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    excused: attendance.filter((a) => a.status === "excused").length,
    unmarked: attendance.filter((a) => a.status === "unmarked").length,
    totalStudents: attendance.length,
    pointsPositive: points.filter((p) => p.points > 0).reduce((s, p) => s + p.points, 0),
    pointsNegative: points.filter((p) => p.points < 0).reduce((s, p) => s + p.points, 0),
    behaviorTotal: behaviors.length,
    behaviorPositive: behaviors.filter((b) => b.severity === "positive").length,
    behaviorMinor: behaviors.filter((b) => b.severity === "minor").length,
    behaviorModerate: behaviors.filter((b) => b.severity === "moderate").length,
    behaviorSerious: behaviors.filter((b) => b.severity === "serious").length,
    topParticipation,
    absentStudents: attendance.filter((a) => a.status === "absent").map((a) => a.studentName),
    followUpBehaviors: behaviors.filter((b) => b.severity === "moderate" || b.severity === "serious").length,
  };

  return { session, summary, points, behaviors, attendance };
}

export async function getSessionsList() {
  const result = await db.execute(sql`
    select se.id, se.session_number as "sessionNumber", se.date, se.title, se.topic,
      se.start_time as "startTime", se.end_time as "endTime", se.status, se.notes,
      se.created_at as "createdAt", se.updated_at as "updatedAt",
      coalesce(a.present, 0) as present, coalesce(a.absent, 0) as absent,
      coalesce(a.late, 0) as late, coalesce(a.excused, 0) as excused,
      coalesce(p.positive, 0) as "pointsPositive", coalesce(p.negative, 0) as "pointsNegative",
      coalesce(b.total, 0) as "behaviorTotal"
    from sessions se
    left join (
      select session_id,
        coalesce(sum(case when status = 'present' then 1 else 0 end), 0) as present,
        coalesce(sum(case when status = 'absent' then 1 else 0 end), 0) as absent,
        coalesce(sum(case when status = 'late' then 1 else 0 end), 0) as late,
        coalesce(sum(case when status = 'excused' then 1 else 0 end), 0) as excused
      from attendance_records group by session_id
    ) a on a.session_id = se.id
    left join (
      select session_id,
        coalesce(sum(case when points > 0 then points else 0 end), 0) as positive,
        coalesce(sum(case when points < 0 then points else 0 end), 0) as negative
      from point_events group by session_id
    ) p on p.session_id = se.id
    left join (
      select session_id, count(*) as total from behavior_incidents group by session_id
    ) b on b.session_id = se.id
    order by se.date desc, se.session_number desc
  `);
  return result;
}
