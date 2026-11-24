"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, StickyNote, Plus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { BehaviorModal, type BehaviorSavedPayload } from "@/components/live/behavior-modal";
import { NoteModal } from "@/components/live/note-modal";

const POSITIVE = [1, 2, 3, 5];
const NEGATIVE = [-1, -2, -3, -5];

export function QuickActionsBar({ studentId, studentName }: { studentId: number; studentName: string }) {
  const [showBehavior, setShowBehavior] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  async function addPoints(value: number) {
    setShowPoints(false);
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, sessionId: null, points: value, reason: "Manual Adjustment", category: value > 0 ? "General" : "Deduction" }),
    });
    const row = await res.json();
    show(`${value > 0 ? "+" : ""}${value} added to ${studentName}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          await fetch(`/api/points?id=${row.id}`, { method: "DELETE" });
          router.refresh();
        },
      },
    });
    router.refresh();
  }

  function onBehaviorSaved(payload: BehaviorSavedPayload) {
    setShowBehavior(false);
    show(`Behavior recorded for ${studentName}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const q = payload.pointEventId ? `?pointEventId=${payload.pointEventId}` : "";
          await fetch(`/api/behaviors/${payload.id}${q}`, { method: "DELETE" });
          router.refresh();
        },
      },
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button onClick={() => setShowPoints((v) => !v)} className="btn">
          <Plus size={14} /> Points
        </button>
        {showPoints && (
          <div
            className="animate-fade-in absolute left-0 top-full z-20 mt-1.5 w-48 rounded-lg border p-2 shadow-lg"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="mb-2 grid grid-cols-4 gap-1">
              {POSITIVE.map((v) => (
                <button key={v} onClick={() => addPoints(v)} className="rounded-md py-1 text-xs font-semibold" style={{ background: "var(--state-present-bg)", color: "var(--state-present)" }}>
                  +{v}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {NEGATIVE.map((v) => (
                <button key={v} onClick={() => addPoints(v)} className="rounded-md py-1 text-xs font-semibold" style={{ background: "var(--state-absent-bg)", color: "var(--state-absent)" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => setShowBehavior(true)} className="btn">
        <ShieldAlert size={14} /> Behavior
      </button>
      <button onClick={() => setShowNote(true)} className="btn">
        <StickyNote size={14} /> Note
      </button>

      {showBehavior && (
        <BehaviorModal
          studentId={studentId}
          studentName={studentName}
          sessionId={null}
          onClose={() => setShowBehavior(false)}
          onSaved={onBehaviorSaved}
        />
      )}
      {showNote && (
        <NoteModal
          studentId={studentId}
          studentName={studentName}
          sessionId={null}
          onClose={() => setShowNote(false)}
          onSaved={() => {
            setShowNote(false);
            show(`Note added for ${studentName}`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}


