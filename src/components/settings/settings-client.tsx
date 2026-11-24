"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, DatabaseBackup, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

interface PointCategory {
  id: number;
  name: string;
  type: string;
  defaultValue: number;
  active: boolean;
}
interface BehaviorCategory {
  id: number;
  name: string;
  type: string;
  defaultSeverity: string;
  active: boolean;
}

export function SettingsClient({
  pointCategories,
  behaviorCategories,
  settingsMap,
}: {
  pointCategories: PointCategory[];
  behaviorCategories: BehaviorCategory[];
  settingsMap: Record<string, string>;
}) {
  const [className, setClassName] = useState(settingsMap.class_name ?? "Mechanics");
  const [recorderName, setRecorderName] = useState(settingsMap.recorder_name ?? "Teacher");
  const [lateCounts, setLateCounts] = useState(settingsMap.late_counts_toward_attendance !== "false");
  const [excusedCounts, setExcusedCounts] = useState(settingsMap.excused_counts_toward_attendance === "true");

  async function saveSetting(key: string, value: string) {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Class configuration */}
      <section className="surface rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold">Class Configuration</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Class Name">
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              onBlur={() => saveSetting("class_name", className)}
              className="input"
            />
          </Field>
          <Field label="Recorder Name">
            <input
              value={recorderName}
              onChange={(e) => setRecorderName(e.target.value)}
              onBlur={() => saveSetting("recorder_name", recorderName)}
              className="input"
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Toggle
            label="Late attendance counts toward attendance rate"
            checked={lateCounts}
            onChange={(v) => {
              setLateCounts(v);
              saveSetting("late_counts_toward_attendance", String(v));
            }}
          />
          <Toggle
            label="Excused absences count toward attendance rate"
            checked={excusedCounts}
            onChange={(v) => {
              setExcusedCounts(v);
              saveSetting("excused_counts_toward_attendance", String(v));
            }}
          />
        </div>
      </section>

      <CategoriesSection title="Point Categories" items={pointCategories} kind="point" />
      <CategoriesSection title="Behavior Categories" items={behaviorCategories} kind="behavior" />

      <ImportSection />

      <BackupSection />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
      <span>{label}</span>
      <span
        className="flex h-5 w-9 items-center rounded-full px-0.5 transition-colors"
        style={{ background: checked ? "var(--brand)" : "var(--bg-subtle)" }}
      >
        <span className="h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </span>
    </button>
  );
}

function CategoriesSection({ title, items, kind }: { title: string; items: (PointCategory | BehaviorCategory)[]; kind: "point" | "behavior" }) {
  const [list, setList] = useState(items);
  const [name, setName] = useState("");
  const [type, setType] = useState<"positive" | "negative">("positive");
  const { show } = useToast();

  async function toggleActive(id: number) {
    const item = list.find((i) => i.id === id);
    if (!item) return;
    const next = !item.active;
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, active: next } : i)));
    await fetch(`/api/categories/${kind}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: next }),
    });
  }

  async function addCategory() {
    if (!name.trim()) return;
    const body =
      kind === "point"
        ? { name, type, defaultValue: type === "positive" ? 1 : -1 }
        : { name, type, defaultSeverity: type === "positive" ? "positive" : "minor" };
    const res = await fetch(`/api/categories/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const row = await res.json();
    setList((prev) => [...prev, row]);
    setName("");
    show(`${name} added`);
  }

  return (
    <section className="surface rounded-2xl p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => toggleActive(c.id)}
            className="pill"
            style={{
              background: c.active ? (c.type === "positive" ? "var(--state-present-bg)" : "var(--state-absent-bg)") : "var(--bg-subtle)",
              color: c.active ? (c.type === "positive" ? "var(--state-present)" : "var(--state-absent)") : "var(--text-faint)",
            }}
            title={c.active ? "Click to deactivate" : "Click to activate"}
          >
            {c.active && <Check size={10} />}
            {c.name}
          </button>
        ))}
        {list.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No categories yet.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="input max-w-[220px]" />
        <select value={type} onChange={(e) => setType(e.target.value as "positive" | "negative")} className="input w-auto">
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
        <button onClick={addCategory} className="btn">
          <Plus size={14} /> Add
        </button>
      </div>
    </section>
  );
}

function ImportSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const cells = line.split(",").map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
      return {
        studentCode: row.studentcode || row.id || row.code || "",
        name: row.name || row.fullname || "",
        className: row.class || row.classname || "",
        email: row.email || "",
        phone: row.phone || "",
      };
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const res = await fetch("/api/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, commit: false }),
    });
    const data = await res.json();
    setPreview(data.preview);
  }

  async function commitImport() {
    if (!preview) return;
    setImporting(true);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview, commit: true }),
      });
      const data = await res.json();
      show(`${data.imported} student(s) imported${data.skipped ? `, ${data.skipped} skipped` : ""}`);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="surface rounded-2xl p-5">
      <h3 className="mb-1 text-sm font-semibold">Import Students</h3>
      <p className="mb-3 text-xs" style={{ color: "var(--text-faint)" }}>
        Upload a CSV with columns: name, studentCode, class, email, phone. Duplicates and missing names are flagged before import.
      </p>
      <input ref={fileRef} type="file" accept=".csv" onChange={onFile} className="text-sm" />

      {preview && (
        <div className="mt-4">
          <div className="surface max-h-64 overflow-y-auto rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p) => (
                  <tr key={p.row} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-1.5">{p.row}</td>
                    <td className="px-3 py-1.5">{p.name || "—"}</td>
                    <td className="px-3 py-1.5 font-mono">{p.studentCode}</td>
                    <td className="px-3 py-1.5">
                      {p.valid ? (
                        <span className="pill status-present">Valid</span>
                      ) : (
                        <span className="pill status-absent" title={p.issues.join(", ")}>
                          {p.issues[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={commitImport} disabled={importing} className="btn btn-primary">
              <Upload size={14} /> {importing ? "Importing..." : `Import ${preview.filter((p) => p.valid).length} Valid Rows`}
            </button>
            <button onClick={() => setPreview(null)} className="btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function BackupSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
  }

  async function restore() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
      if (!res.ok) throw new Error();
      show("Backup restored successfully");
      setConfirming(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      show("Could not restore backup — invalid file", { tone: "error" });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <section className="surface rounded-2xl p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <DatabaseBackup size={15} style={{ color: "var(--brand)" }} /> Backup &amp; Restore
      </h3>
      <p className="mb-3 text-xs" style={{ color: "var(--text-faint)" }}>
        Export a complete backup from the Reports page. Restoring a backup replaces all current data.
      </p>
      <input ref={fileRef} type="file" accept="application/json" onChange={onFile} className="text-sm" />
      {confirming && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--state-absent)" }}>
          <AlertTriangle size={15} style={{ color: "var(--state-absent)" }} />
          <span>This will replace all existing data. Continue?</span>
          <button onClick={restore} disabled={restoring} className="btn btn-danger ml-auto">
            {restoring ? "Restoring..." : "Yes, Restore"}
          </button>
          <button onClick={() => setConfirming(false)} className="btn">
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
