import { getStudentsList } from "@/lib/queries";
import { ReportsClient } from "@/components/reports/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const students = (await getStudentsList()) as any[];
  return (
    <div className="mx-auto max-w-4xl px-4 py-7 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          Export professional PDF and Excel reports built from live session data.
        </p>
      </div>
      <ReportsClient students={students.map((s) => ({ id: s.id, name: s.name, studentCode: s.studentCode }))} />
    </div>
  );
}
