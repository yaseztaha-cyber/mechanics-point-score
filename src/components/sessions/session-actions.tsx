"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Radio, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function SessionActions({ sessionId, status }: { sessionId: number; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  async function setStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      show(newStatus === "locked" ? "Session locked" : newStatus === "completed" ? "Session reopened as completed" : "Session reopened");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "in_progress") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => router.push("/live")} className="btn btn-primary">
          <Radio size={14} /> Resume Live Session
        </button>
        <DeleteButton sessionId={sessionId} />
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={loading} onClick={() => setStatus("completed")} className="btn">
          <Unlock size={14} /> Unlock Session
        </button>
        <DeleteButton sessionId={sessionId} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button disabled={loading} onClick={() => setStatus("in_progress")} className="btn">
        <Radio size={14} /> Reopen Session
      </button>
      <button disabled={loading} onClick={() => setStatus("locked")} className="btn">
        <Lock size={14} /> Lock Session
      </button>
      <DeleteButton sessionId={sessionId} />
    </div>
  );
}

function DeleteButton({ sessionId }: { sessionId: number }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      show("Session and all its records deleted");
      router.push("/sessions");
    } catch {
      show("Could not delete session", { tone: "error" });
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="btn" style={{ color: "var(--state-absent)" }}>
        <Trash2 size={14} /> Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: "var(--text-faint)" }}>
        Delete this session and all its records?
      </span>
      <button disabled={deleting} onClick={remove} className="btn btn-danger !px-2 !py-1 text-xs">
        {deleting ? "Deleting..." : "Yes, Delete"}
      </button>
      <button disabled={deleting} onClick={() => setConfirming(false)} className="btn !px-2 !py-1 text-xs">
        Cancel
      </button>
    </div>
  );
}
