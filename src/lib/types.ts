export type AttendanceStatus = "unmarked" | "present" | "absent" | "late" | "excused";

export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "locked";

export type Severity = "minor" | "moderate" | "serious" | "positive";

export type BehaviorType = "positive" | "negative";

export type NotePriority = "low" | "normal" | "high";

export interface StudentDTO {
  id: number;
  studentCode: string;
  name: string;
  className: string;
  status: string;
  email: string | null;
  phone: string | null;
  avatarColor: string;
  createdAt: string;
}

export interface SessionDTO {
  id: number;
  sessionNumber: number;
  date: string;
  title: string;
  topic: string | null;
  startTime: string | null;
  endTime: string | null;
  status: SessionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  unmarked: "Unmarked",
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  serious: "Serious",
  positive: "Positive",
};
