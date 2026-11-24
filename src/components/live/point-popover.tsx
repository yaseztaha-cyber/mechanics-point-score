"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { FloatingPanel } from "./floating-panel";

const POSITIVE = [1, 2, 3, 5];
const NEGATIVE = [-1, -2, -3, -5];
const HALF = [0.5, -0.5];

export function PointPopover({ onPick }: { onPick: (value: number, reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={btnRef} onClick={() => setOpen((v) => !v)} className="btn !px-2 !py-1 text-xs" aria-label="Add points">
        <Plus size={12} /> Points
      </button>
      {open && (
        <FloatingPanel anchorRef={btnRef} onClose={() => setOpen(false)} width={176}>
          <div className="p-2">
            <p className="mb-1 px-1 text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: "var(--state-present)" }}>
              Add
            </p>
            <div className="mb-2 grid grid-cols-4 gap-1">
              {POSITIVE.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    onPick(v, "Quick Adjustment");
                    setOpen(false);
                  }}
                  className="rounded-md py-1 text-xs font-semibold"
                  style={{ background: "var(--state-present-bg)", color: "var(--state-present)" }}
                >
                  +{v}
                </button>
              ))}
            </div>
            <p className="mb-1 px-1 text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: "var(--state-absent)" }}>
              Deduct
            </p>
            <div className="mb-2 grid grid-cols-4 gap-1">
              {NEGATIVE.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    onPick(v, "Quick Adjustment");
                    setOpen(false);
                  }}
                  className="rounded-md py-1 text-xs font-semibold"
                  style={{ background: "var(--state-absent-bg)", color: "var(--state-absent)" }}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mb-1 px-1 text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Half points
            </p>
            <div className="grid grid-cols-2 gap-1">
              {HALF.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    onPick(v, "Quick Adjustment");
                    setOpen(false);
                  }}
                  className="rounded-md py-1 text-xs font-semibold"
                  style={{
                    background: v > 0 ? "var(--state-present-bg)" : "var(--state-absent-bg)",
                    color: v > 0 ? "var(--state-present)" : "var(--state-absent)",
                  }}
                >
                  {v > 0 ? `+${v}` : `${v}`}
                </button>
              ))}
            </div>
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}
