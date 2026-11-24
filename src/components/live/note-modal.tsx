"use client";

import { useState } from "react";
import { X, StickyNote } from "lucide-react";

const CATEGORIES = ["General", "Academic", "Behavior", "Participation", "Homework", "Follow-up"];
const PRIORITIES = ["low", "normal", "high"];

export function NoteModal({
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
  onSaved: () => void;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, sessionId, content, category, priority }),
      });
      onSaved();
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
            <StickyNote size={16} style={{ color: "var(--brand)" }} />
            <p className="text-sm font-semibold">Add Note — {studentName}</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-faint)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Forgot calculator today."
            rows={3}
            className="input mb-4 resize-none"
          />
          <div className="mb-1 flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Category
              </p>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Priority
              </p>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !content.trim()} className="btn btn-primary">
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
