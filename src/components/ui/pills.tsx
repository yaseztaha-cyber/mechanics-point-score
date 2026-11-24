import type { AttendanceStatus, Severity } from "@/lib/types";
import { ATTENDANCE_LABELS, SEVERITY_LABELS } from "@/lib/types";

export function AttendancePill({ status }: { status: AttendanceStatus | string }) {
  const cls =
    status === "present"
      ? "status-present"
      : status === "absent"
        ? "status-absent"
        : status === "late"
          ? "status-late"
          : status === "excused"
            ? "status-excused"
            : "status-unmarked";
  const label = ATTENDANCE_LABELS[status as AttendanceStatus] ?? "Unmarked";
  return (
    <span className={`pill ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {label}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: Severity | string }) {
  const cls =
    severity === "minor"
      ? "sev-minor"
      : severity === "moderate"
        ? "sev-moderate"
        : severity === "serious"
          ? "sev-serious"
          : "sev-positive";
  const label = SEVERITY_LABELS[severity as Severity] ?? severity;
  return <span className={`pill ${cls}`}>{label}</span>;
}

export function PointsBadge({ value }: { value: number }) {
  const color = value > 0 ? "var(--state-present)" : value < 0 ? "var(--state-absent)" : "var(--text-faint)";
  const bg = value > 0 ? "var(--state-present-bg)" : value < 0 ? "var(--state-absent-bg)" : "var(--bg-subtle)";
  return (
    <span className="pill" style={{ color, background: bg }}>
      {value > 0 ? "+" : ""}
      {value}
    </span>
  );
}
