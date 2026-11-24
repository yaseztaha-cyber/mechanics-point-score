import { db } from "../src/db";
import {
  students,
  sessions,
  attendanceRecords,
  pointEvents,
  behaviorIncidents,
  studentNotes,
  pointCategories,
  behaviorCategories,
  settings,
} from "../src/db/schema";
import { sql } from "drizzle-orm";

const NAMES = [
  "Ahmed Mohamed", "Sara Ali", "Omar Khaled", "Mohamed Hassan", "Layla Ibrahim",
  "Youssef Adel", "Mariam Fathy", "Khaled Samir", "Nour Tarek", "Ali Mostafa",
  "Hana Gamal", "Karim Nabil", "Dina Sherif", "Mostafa Reda", "Salma Yousef",
  "Hassan Amin", "Reem Wael", "Tarek Fouad", "Yasmin Osman", "Amr Zaki",
  "Fatma Rashad", "Ziad Hesham", "Rania Magdy", "Ibrahim Adel", "Noha Kamel",
  "Seif Elnaggar", "Aya Sobhy", "Mahmoud Fahmy",
];

const AVATAR_COLORS = ["#0f6e66", "#b5551a", "#4f46e5", "#0891b2", "#be185d", "#15803d", "#a16207", "#6d28d9"];

const TOPICS = [
  "Introduction to Forces", "Newton's First Law", "Newton's Second Law", "Newton's Third Law",
  "Kinematics in 1D", "Kinematics in 2D", "Projectile Motion", "Friction & Normal Force",
  "Work and Energy", "Conservation of Energy", "Momentum & Collisions", "Torque & Rotational Motion",
  "Simple Machines", "Equilibrium of Rigid Bodies", "Gear Ratios & Mechanical Advantage",
];

const POSITIVE_POINT_CATS = [
  { name: "Participation", value: 1 },
  { name: "Correct Answer", value: 2 },
  { name: "Excellent Problem Solving", value: 3 },
  { name: "Homework Complete", value: 2 },
  { name: "Helping a Peer", value: 2 },
];
const NEGATIVE_POINT_CATS = [
  { name: "Disruption", value: -1 },
  { name: "Incomplete Work", value: -2 },
  { name: "Late Submission", value: -1 },
];

const BEHAVIOR_CATS_NEG = [
  { name: "Talking", severity: "minor" },
  { name: "Disruption", severity: "moderate" },
  { name: "Incomplete Work", severity: "minor" },
  { name: "Instructions Ignored", severity: "moderate" },
  { name: "Misuse of Equipment", severity: "serious" },
  { name: "Leaving Seat", severity: "minor" },
];
const BEHAVIOR_CATS_POS = [
  { name: "Positive Teamwork", severity: "positive" },
  { name: "Excellent Participation", severity: "positive" },
  { name: "Helping Another Student", severity: "positive" },
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chance(p: number) {
  return Math.random() < p;
}

async function main() {
  console.log("Seeding database...");

  const existing = await db.select().from(students).limit(1);
  if (existing.length > 0) {
    console.log("Data already exists — skipping seed.");
    return;
  }

  // Categories
  await db.insert(pointCategories).values([
    ...POSITIVE_POINT_CATS.map((c, i) => ({ name: c.name, type: "positive", defaultValue: c.value, sortOrder: i })),
    ...NEGATIVE_POINT_CATS.map((c, i) => ({ name: c.name, type: "negative", defaultValue: c.value, sortOrder: i + 10 })),
  ]);
  await db.insert(behaviorCategories).values([
    ...BEHAVIOR_CATS_NEG.map((c, i) => ({ name: c.name, type: "negative", defaultSeverity: c.severity, sortOrder: i })),
    ...BEHAVIOR_CATS_POS.map((c, i) => ({ name: c.name, type: "positive", defaultSeverity: "positive", sortOrder: i + 10 })),
  ]);
  await db.insert(settings).values([
    { key: "recorder_name", value: "Teacher" },
    { key: "class_name", value: "Mechanics" },
    { key: "late_counts_toward_attendance", value: "true" },
    { key: "excused_counts_toward_attendance", value: "false" },
  ]);

  // Students
  const studentRows = await db
    .insert(students)
    .values(
      NAMES.map((name, i) => ({
        studentCode: `MEC-${String(i + 1).padStart(3, "0")}`,
        name,
        className: "Mechanics",
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      })),
    )
    .returning();

  // Sessions: 14 past sessions (every 3 days back), 1 in-progress today
  const today = new Date();
  const pastSessionCount = 14;
  const sessionRows: (typeof sessions.$inferSelect)[] = [];
  for (let i = pastSessionCount; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 3);
    const [row] = await db
      .insert(sessions)
      .values({
        sessionNumber: pastSessionCount - i + 1,
        date: d.toISOString().slice(0, 10),
        title: `Session ${pastSessionCount - i + 1}`,
        topic: TOPICS[(pastSessionCount - i) % TOPICS.length],
        startTime: "16:00",
        endTime: "17:30",
        status: "completed",
      })
      .returning();
    sessionRows.push(row);
  }

  // Today's in-progress session
  const [todaySession] = await db
    .insert(sessions)
    .values({
      sessionNumber: pastSessionCount + 1,
      date: today.toISOString().slice(0, 10),
      title: `Session ${pastSessionCount + 1}`,
      topic: TOPICS[pastSessionCount % TOPICS.length],
      startTime: "16:00",
      status: "in_progress",
    })
    .returning();
  sessionRows.push(todaySession);

  // Give a few students a trend profile
  const strugglingIds = new Set(studentRows.slice(0, 3).map((s) => s.id));
  const starIds = new Set(studentRows.slice(3, 6).map((s) => s.id));

  for (const [idx, session] of sessionRows.entries()) {
    const isToday = session.id === todaySession.id;
    for (const student of studentRows) {
      let status: "present" | "absent" | "late" | "excused" = "present";
      if (isToday) {
        // Partially recorded "live" session
        const roll = Math.random();
        if (roll < 0.78) status = "present";
        else if (roll < 0.86) status = "late";
        else if (roll < 0.92) status = "excused";
        else status = "absent";
        if (chance(0.15)) continue; // leave some unmarked to feel "in progress"
      } else {
        const strugglingBoost = strugglingIds.has(student.id) ? 0.18 : 0;
        const roll = Math.random();
        if (roll < 0.86 - strugglingBoost) status = "present";
        else if (roll < 0.93 - strugglingBoost / 2) status = "late";
        else if (roll < 0.96) status = "excused";
        else status = "absent";
      }

      await db.insert(attendanceRecords).values({
        studentId: student.id,
        sessionId: session.id,
        status,
      });

      if (status === "present" || status === "late") {
        // Points
        if (starIds.has(student.id) && chance(0.75)) {
          const cat = rand(POSITIVE_POINT_CATS);
          await db.insert(pointEvents).values({
            studentId: student.id,
            sessionId: session.id,
            points: cat.value,
            category: cat.name,
            reason: cat.name,
            recordedBy: "Teacher",
          });
        } else if (chance(0.4)) {
          const cat = rand(POSITIVE_POINT_CATS);
          await db.insert(pointEvents).values({
            studentId: student.id,
            sessionId: session.id,
            points: cat.value,
            category: cat.name,
            reason: cat.name,
            recordedBy: "Teacher",
          });
        }

        if (strugglingIds.has(student.id) && chance(0.5)) {
          const cat = rand(NEGATIVE_POINT_CATS);
          await db.insert(pointEvents).values({
            studentId: student.id,
            sessionId: session.id,
            points: cat.value,
            category: cat.name,
            reason: cat.name,
            recordedBy: "Teacher",
          });
          const beh = rand(BEHAVIOR_CATS_NEG);
          await db.insert(behaviorIncidents).values({
            studentId: student.id,
            sessionId: session.id,
            category: beh.name,
            severity: beh.severity,
            description: `${beh.name} observed during session.`,
            relatedPoints: cat.value,
            recordedBy: "Teacher",
          });
        } else if (chance(0.08)) {
          const cat = rand(NEGATIVE_POINT_CATS);
          await db.insert(pointEvents).values({
            studentId: student.id,
            sessionId: session.id,
            points: cat.value,
            category: cat.name,
            reason: cat.name,
            recordedBy: "Teacher",
          });
        }

        if (chance(0.06) && !strugglingIds.has(student.id)) {
          const beh = rand(BEHAVIOR_CATS_POS);
          await db.insert(behaviorIncidents).values({
            studentId: student.id,
            sessionId: session.id,
            category: beh.name,
            severity: "positive",
            description: `${beh.name} recognized during session.`,
            relatedPoints: 0,
            recordedBy: "Teacher",
          });
        }

        if (chance(0.05)) {
          const noteCategories = ["Academic", "Participation", "Homework", "Follow-up", "General"];
          const sampleNotes = [
            "Forgot calculator today.",
            "Had difficulty with vector decomposition.",
            "Asked for clarification after class.",
            "Worked well with team on lab exercise.",
            "Needs follow-up on today's homework.",
            "Showed strong improvement in problem solving.",
          ];
          await db.insert(studentNotes).values({
            studentId: student.id,
            sessionId: session.id,
            category: rand(noteCategories),
            priority: chance(0.2) ? "high" : "normal",
            content: rand(sampleNotes),
            author: "Teacher",
          });
        }
      }
    }
    void idx;
  }

  console.log(`Seeded ${studentRows.length} students and ${sessionRows.length} sessions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
