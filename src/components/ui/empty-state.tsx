import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center" style={{ borderColor: "var(--border-strong)" }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--bg-subtle)" }}>
        <Icon size={20} style={{ color: "var(--text-faint)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm" style={{ color: "var(--text-faint)" }}>
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
