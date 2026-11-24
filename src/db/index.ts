import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("sqlite.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const baseDb = drizzle(sqlite, { schema });

type RawQuery = Parameters<typeof baseDb.all>[0];

// sqlite-core exposes raw results via `db.all()` (pg uses `db.execute()`).
// Provide `execute` as an alias so existing call sites keep working;
// it returns the rows array directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = baseDb as typeof baseDb & { execute: (query: RawQuery) => any[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(baseDb as unknown as { execute: (query: RawQuery) => any[] }).execute = (query: RawQuery) =>
  baseDb.all(query);
