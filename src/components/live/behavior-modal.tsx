"use client";

import { useEffect, useState } from "react";
import { X, ShieldAlert } from "lucide-react";

interface BehaviorCategory {
  id: number;
  name: string;
  type: string;
  defaultSeverity: string;
}

export interface BehaviorSavedPayload {
  id: number;
  studentId: number;
  category: string;
  severity: string;
  relatedPoints: number;
  description: string | null;
  pointEventId: number | null;
}

const SEVERITIES = [
  { key: "minor", label: "Minor" },
  { key: "moderate", label: "Moderate" },
  { key: "serious", label: "Serious" },
  { key: "positive", label: "Positive" },
];

const POINT_OPTIONS = [0, -1, -2, -3];

export function BehaviorModal({
  studentId,
  studentName,
  sessionId,
  onClose,
  onSaved,
}: {
  studentId: number;
  studentName: string;
  sessionId: number | null;
  onClose: () => void;
  onSaved: (payload: BehaviorSavedPayload) => void;
}) {
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [category, setCategory] = useState<string>("");
  const [severity, setSeverity] = useState("minor");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(0);
  const [customPoints, setCustomPoints] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/categories/behavior")
      .then((r) => r.json())
      .then((data: BehaviorCategory[]) => {
        setCategories(data);
        if (data.length > 0) {
          setCategory(data[0].name);
          setSeverity(data[0].defaultSeverity);
        }
      });
  }, []);

  function selectCategory(c: BehaviorCategory) {
    setCategory(c.name);
    setSeverity(c.defaultSeverity);
    if (c.defaultSeverity === "positive") setPoints(0);
  }

  async function save() {
    if (!category) return;
    setSaving(true);
    const finalPoints = customPoints.trim() !== "" ? Number(customPoints) : points;
    try {
      const res = await fetch("/api/behaviors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionId,
          category,
          severity,
          description: description.trim() || null,
          relatedPoints: finalPoints || 0,
        }),
      });
      const row = await res.json();
      onSaved(row);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="animate-fade-in w-full max-w-md overflow-hidden rounded-xl border shadow-2xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: "var(--sev-moderate)" }} />
            <p className="text-sm font-semibold">Record Behavior — {studentName}</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-faint)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto scrollbar-thin px-4 py-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Type
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCategory(c)}
                className="btn !px-2.5 !py-1 text-xs"
                style={
                  category === c.name
                    ? { background: "var(--brand-soft)", borderColor: "var(--brand)", color: "var(--brand-strong)" }
                    : undefined
                }
              >
                {c.type === "positive" ? "✓" : "⚠"} {c.name}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Severity
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {SEVERITIES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSeverity(s.key)}
                className={`pill ${severity === s.key ? `sev-${s.key}` : ""}`}
                style={severity !== s.key ? { background: "var(--bg-subtle)", color: "var(--text-muted)" } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Note (optional)
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Continued talking while instructions were being explained."
            rows={3}
            className="input mb-4 resize-none"
          />

          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Point Effect (optional)
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {POINT_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPoints(p);
                  setCustomPoints("");
                }}
                className="btn !px-2.5 !py-1 text-xs"
                style={
                  points === p && customPoints === ""
                    ? { background: "var(--brand-soft)", borderColor: "var(--brand)", color: "var(--brand-strong)" }
                    : undefined
                }
              >
                {p === 0 ? "No points" : p}
              </button>
            ))}
            <input
              value={customPoints}
              onChange={(e) => setCustomPoints(e.target.value)}
              placeholder="Custom"
              type="number"
              className="input w-20 !py-1 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !category} className="btn btn-primary">
            {saving ? "Saving..." : "Save Behavior"}
          </button>
        </div>
      </div>
    </div>
  );
}
