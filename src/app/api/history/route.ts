import { NextRequest } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const studentId = sp.get("studentId");
  const type = sp.get("type"); // attendance | point | behavior | note
  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  const q = sp.get("q");
  const page = Number(sp.get("page") ?? "1");
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  const studentFilter = studentId ? sql`and student_id = ${Number(studentId)}` : sql``;
  const qFilter = q ? sql`and student_name like ${"%" + q + "%"}` : sql``;
  const dateFromFilter = dateFrom ? sql`and ts >= ${dateFrom}` : sql``;
  const dateToFilter = dateTo ? sql`and ts <= ${dateTo}` : sql``;

  const unionQuery = sql`
    (select 'attendance' as kind, ar.id, ar.student_id, s.name as student_name, ar.session_id,
      ar.status as detail, null as points, null as severity, ar.note as note, ar.updated_at as ts
     from attendance_records ar join students s on s.id = ar.student_id
     where ar.status != 'unmarked')
    union all
    (select 'point' as kind, pe.id, pe.student_id, s.name as student_name, pe.session_id,
      pe.reason as detail, pe.points, null as severity, pe.note as note, pe.created_at as ts
     from point_events pe join students s on s.id = pe.student_id)
    union all
    (select 'behavior' as kind, bi.id, bi.student_id, s.name as student_name, bi.session_id,
      bi.category as detail, bi.related_points as points, bi.severity, bi.description as note, bi.created_at as ts
     from behavior_incidents bi join students s on s.id = bi.student_id)
    union all
    (select 'note' as kind, n.id, n.student_id, s.name as student_name, n.session_id,
      n.category as detail, null as points, null as severity, n.content as note, n.created_at as ts
     from student_notes n join students s on s.id = n.student_id)
  `;

  const typeFilter = type ? sql`where kind = ${type}` : sql``;

  const result = await db.execute(sql`
    select * from (${unionQuery}) combined
    ${typeFilter}
    ${type ? sql`` : sql`where true`}
    ${studentFilter}
    ${qFilter}
    ${dateFromFilter}
    ${dateToFilter}
    order by ts desc
    limit ${pageSize} offset ${offset}
  `);

  const countResult = await db.execute(sql`
    select count(*) as count from (${unionQuery}) combined
    ${typeFilter}
    ${type ? sql`` : sql`where true`}
    ${studentFilter}
    ${qFilter}
    ${dateFromFilter}
    ${dateToFilter}
  `);

  return Response.json({
    rows: result,
    total: (countResult[0] as any).count,
    page,
    pageSize,
  });
}
