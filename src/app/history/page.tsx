import { HistoryFeed } from "@/components/history/history-feed";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-7 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          Complete chronological record of attendance, points, behavior, and notes.
        </p>
      </div>
      <HistoryFeed />
    </div>
  );
}
