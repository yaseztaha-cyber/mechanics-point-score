import { NextRequest } from "next/server";
import { db } from "@/db";
import { students, attendanceRecords } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = Number(id);

  // Ensure attendance rows exist for every active student in this session.
  const activeStudents = await db.select({ id: students.id }).from(students).where(eq(students.status, "active"));
  if (activeStudents.length > 0) {
    await db
      .insert(attendanceRecords)
      .values(activeStudents.map((s) => ({ studentId: s.id, sessionId, status: "unmarked" as const })))
      .onConflictDoNothing();
  }

  const result = await db.execute(sql`
    select s.id, s.student_code as "studentCode", s.name, s.avatar_color as "avatarColor",
      ar.status as "attendanceStatus", ar.id as "attendanceId",
      coalesce(sp.total, 0) as "sessionPoints",
      coalesce(sb.total, 0) as "sessionBehaviorCount",
      coalesce(np.net, 0) as "netPoints"
    from students s
    join attendance_records ar on ar.student_id = s.id and ar.session_id = ${sessionId}
    left join (
      select student_id, sum(points) as total from point_events where session_id = ${sessionId} group by student_id
    ) sp on sp.student_id = s.id
    left join (
      select student_id, count(*) as total from behavior_incidents where session_id = ${sessionId} group by student_id
    ) sb on sb.student_id = s.id
    left join (
      select student_id, sum(points) as net from point_events group by student_id
    ) np on np.student_id = s.id
    where s.status = 'active'
    order by s.name asc
  `);

  return Response.json(result);
}
