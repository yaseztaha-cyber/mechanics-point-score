import { getStudentsList } from "@/lib/queries";
import { StudentsTable } from "@/components/students/students-table";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = (await getStudentsList()) as any[];
  return (
    <div className="mx-auto max-w-6xl px-4 py-7 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
            Roster, attendance, points, and behavior at a glance.
          </p>
        </div>
      </div>
      <StudentsTable initialStudents={students} />
    </div>
  );
}
