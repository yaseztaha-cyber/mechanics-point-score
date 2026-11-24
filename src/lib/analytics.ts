import type { AttendanceStatus, Severity } from "./types";

export interface AttendanceLike {
  status: AttendanceStatus;
  sessionId: number;
}

export interface PointLike {
  points: number;
  sessionId: number | null;
  createdAt: string | Date;
}

export interface BehaviorLike {
  severity: Severity;
  category: string;
  sessionId: number | null;
  createdAt: string | Date;
}

export function attendanceStats(records: AttendanceLike[]) {
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const total = present + absent + late + excused;
  // Present + Late count toward attendance; Excused is neutral (not counted against).
  const validForRate = total - excused;
  const attended = present + late;
  const rate = validForRate > 0 ? Math.round((attended / validForRate) * 1000) / 10 : 0;
  return { present, absent, late, excused, total, rate };
}

export function pointStats(events: PointLike[]) {
  const positive = events.filter((e) => e.points > 0).reduce((s, e) => s + e.points, 0);
  const negative = events.filter((e) => e.points < 0).reduce((s, e) => s + e.points, 0);
  const net = positive + negative;
  const sessionsWithPoints = new Map<number, number>();
  for (const e of events) {
    if (e.sessionId == null) continue;
    sessionsWithPoints.set(e.sessionId, (sessionsWithPoints.get(e.sessionId) ?? 0) + e.points);
  }
  const perSession = Array.from(sessionsWithPoints.entries()).map(([sessionId, total]) => ({
    sessionId,
    total,
  }));
  const best = perSession.reduce<{ sessionId: number; total: number } | null>(
    (acc, cur) => (acc === null || cur.total > acc.total ? cur : acc),
    null,
  );
  const worst = perSession.reduce<{ sessionId: number; total: number } | null>(
    (acc, cur) => (acc === null || cur.total < acc.total ? cur : acc),
    null,
  );
  const average = perSession.length > 0 ? Math.round((net / perSession.length) * 10) / 10 : 0;
  return { positive, negative, net, average, best, worst, sessionsCount: perSession.length };
}

export function behaviorStats(incidents: BehaviorLike[]) {
  const minor = incidents.filter((i) => i.severity === "minor").length;
  const moderate = incidents.filter((i) => i.severity === "moderate").length;
  const serious = incidents.filter((i) => i.severity === "serious").length;
  const positive = incidents.filter((i) => i.severity === "positive").length;
  const negativeTotal = minor + moderate + serious;
  const byCategory = new Map<string, number>();
  for (const i of incidents) {
    byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
  }
  const topCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));
  return { minor, moderate, serious, positive, negativeTotal, total: incidents.length, topCategories };
}

/** Detect a student having repeated negative incidents across the most recent N sessions. */
export function repeatedBehaviorAlert(
  incidents: BehaviorLike[],
  recentSessionIds: number[],
): string | null {
  const negative = incidents.filter((i) => i.severity !== "positive");
  const inWindow = negative.filter((i) => i.sessionId != null && recentSessionIds.includes(i.sessionId));
  if (inWindow.length >= 3) {
    return `${inWindow.length} behavior incidents across the last ${recentSessionIds.length} sessions`;
  }
  return null;
}

export function consecutiveNegativePointSessions(perSessionTotals: { sessionId: number; total: number }[]): number {
  let streak = 0;
  for (let i = perSessionTotals.length - 1; i >= 0; i--) {
    if (perSessionTotals[i].total < 0) streak++;
    else break;
  }
  return streak;
}
