import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return Response.json({ students: [], sessions: [] });

  const studentRows = (
    await db.execute(sql`
      select s.id, s.name, s.student_code as "studentCode",
        coalesce(a.total, 0) as sessions,
        coalesce(a.attended, 0) as attended,
        coalesce(p.net, 0) as "netPoints",
        coalesce(b.total, 0) as "behaviorTotal"
      from students s
      left join (
        select student_id, coalesce(sum(case when status != 'unmarked' then 1 else 0 end), 0) as total,
          coalesce(sum(case when status in ('present','late') then 1 else 0 end), 0) as attended
        from attendance_records group by student_id
      ) a on a.student_id = s.id
      left join (select student_id, sum(points) as net from point_events group by student_id) p on p.student_id = s.id
      left join (
        select student_id, count(*) as total from behavior_incidents where severity != 'positive' group by student_id
      ) b on b.student_id = s.id
      where s.name like ${"%" + q + "%"} or s.student_code like ${"%" + q + "%"}
      limit 8
    `)
  ) as any[];

  const sessionRows = (
    await db.execute(sql`
      select id, session_number as "sessionNumber", title, topic, date
      from sessions where title like ${"%" + q + "%"} or topic like ${"%" + q + "%"} or cast(date as text) like ${"%" + q + "%"}
      order by date desc limit 6
    `)
  );

  return Response.json({
    students: studentRows.map((s) => ({
      ...s,
      attendanceRate: s.sessions > 0 ? Math.round((s.attended / s.sessions) * 1000) / 10 : 0,
    })),
    sessions: sessionRows,
  });
}
