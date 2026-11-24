"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function StartSessionButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Mechanics Session" }),
      });
      if (!res.ok) throw new Error();
      const session = await res.json();
      show(`Session ${session.sessionNumber} started`);
      router.push("/live");
      router.refresh();
    } catch {
      show("Could not start session", { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={start} disabled={loading} className="btn btn-primary">
      <Play size={14} /> {loading ? "Starting..." : "Start Today's Session"}
    </button>
  );
}
