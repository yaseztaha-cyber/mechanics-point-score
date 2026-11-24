import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const students = sqliteTable(
  "students",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentCode: text("student_code").notNull(),
    name: text("name").notNull(),
    className: text("class_name").notNull().default("Mechanics"),
    status: text("status").notNull().default("active"),
    email: text("email"),
    phone: text("phone"),
    avatarColor: text("avatar_color").notNull().default("#2563eb"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("students_code_idx").on(t.studentCode)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionNumber: integer("session_number").notNull(),
    date: text("date").notNull(),
    title: text("title").notNull(),
    topic: text("topic"),
    startTime: text("start_time"),
    endTime: text("end_time"),
    status: text("status").notNull().default("scheduled"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("sessions_date_idx").on(t.date)],
);

export const attendanceRecords = sqliteTable(
  "attendance_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("unmarked"),
    note: text("note"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    uniqueIndex("attendance_student_session_idx").on(t.studentId, t.sessionId),
    index("attendance_session_idx").on(t.sessionId),
    index("attendance_student_idx").on(t.studentId),
  ],
);

export const pointCategories = sqliteTable("point_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  defaultValue: integer("default_value").notNull().default(1),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pointEvents = sqliteTable(
  "point_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    category: text("category").notNull().default("General"),
    reason: text("reason"),
    note: text("note"),
    recordedBy: text("recorded_by").notNull().default("Teacher"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("points_student_idx").on(t.studentId),
    index("points_session_idx").on(t.sessionId),
  ],
);

export const behaviorCategories = sqliteTable("behavior_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  defaultSeverity: text("default_severity").notNull().default("minor"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const behaviorIncidents = sqliteTable(
  "behavior_incidents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    severity: text("severity").notNull().default("minor"),
    description: text("description"),
    relatedPoints: integer("related_points").notNull().default(0),
    note: text("note"),
    status: text("status").notNull().default("open"),
    recordedBy: text("recorded_by").notNull().default("Teacher"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("behavior_student_idx").on(t.studentId),
    index("behavior_session_idx").on(t.sessionId),
  ],
);

export const studentNotes = sqliteTable(
  "student_notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }),
    category: text("category").notNull().default("General"),
    priority: text("priority").notNull().default("normal"),
    content: text("content").notNull(),
    author: text("author").notNull().default("Teacher"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("notes_student_idx").on(t.studentId)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entity: text("entity").notNull(),
    entityId: integer("entity_id").notNull(),
    action: text("action").notNull(),
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
