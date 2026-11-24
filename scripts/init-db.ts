import Database from "better-sqlite3";

const sqlite = new Database("sqlite.db");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_code TEXT NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL DEFAULT 'Mechanics',
    status TEXT NOT NULL DEFAULT 'active',
    email TEXT,
    phone TEXT,
    avatar_color TEXT NOT NULL DEFAULT '#2563eb',
    created_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS students_code_idx ON students(student_code);

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_number INTEGER NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    start_time TEXT,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions(date);

  CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'unmarked',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_session_idx ON attendance_records(student_id, session_id);
  CREATE INDEX IF NOT EXISTS attendance_session_idx ON attendance_records(session_id);
  CREATE INDEX IF NOT EXISTS attendance_student_idx ON attendance_records(student_id);

  CREATE TABLE IF NOT EXISTS point_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    default_value INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS point_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    reason TEXT,
    note TEXT,
    recorded_by TEXT NOT NULL DEFAULT 'Teacher',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS points_student_idx ON point_events(student_id);
  CREATE INDEX IF NOT EXISTS points_session_idx ON point_events(session_id);

  CREATE TABLE IF NOT EXISTS behavior_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    default_severity TEXT NOT NULL DEFAULT 'minor',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS behavior_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'minor',
    description TEXT,
    related_points INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    recorded_by TEXT NOT NULL DEFAULT 'Teacher',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS behavior_student_idx ON behavior_incidents(student_id);
  CREATE INDEX IF NOT EXISTS behavior_session_idx ON behavior_incidents(session_id);

  CREATE TABLE IF NOT EXISTS student_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'General',
    priority TEXT NOT NULL DEFAULT 'normal',
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Teacher',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS notes_student_idx ON student_notes(student_id);

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_log(entity, entity_id);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

console.log("Database initialized successfully");
