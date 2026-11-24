"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  CalendarDays,
  Users,
  ShieldAlert,
  FileBarChart,
  History,
  Settings,
  Search,
  Moon,
  Sun,
  Wrench,
} from "lucide-react";
import { useTheme } from "./providers/theme-provider";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/live", label: "Live Session", icon: Radio },
  { href: "/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/students", label: "Students", icon: Users },
  { href: "/behavior", label: "Behavior", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen">
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r px-3 py-4 md:flex"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <div className="flex items-center gap-2 px-2 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--brand)" }}
          >
            <Wrench size={16} color="white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Mechanics</p>
            <p className="text-[0.65rem] leading-tight" style={{ color: "var(--text-faint)" }}>
              Session Operations
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium"
                style={{
                  background: active ? "var(--brand-soft)" : "transparent",
                  color: active ? "var(--brand-strong)" : "var(--text-muted)",
                }}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          className="nav-link flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
        >
          <span className="flex items-center gap-2">
            <Search size={14} /> Search
          </span>
          <span className="kbd">⌘K</span>
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-2.5 md:px-6"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <div className="flex items-center gap-2 md:hidden">
            <Wrench size={16} style={{ color: "var(--brand)" }} />
            <span className="text-sm font-semibold">Mechanics</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link shrink-0 rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    background: active ? "var(--brand-soft)" : "transparent",
                    color: active ? "var(--brand-strong)" : "var(--text-muted)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden flex-1 md:block" />
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="nav-link hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs md:flex"
            style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
          >
            <Search size={13} /> Quick search <span className="kbd ml-1">⌘K</span>
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="btn !px-2"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
