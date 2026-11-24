import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { AppShell } from "@/components/app-shell";
import { CommandPalette } from "@/components/command-palette";

export const metadata: Metadata = {
  title: "Mechanics — Attendance, Points & Performance",
  description: "Session operations console for Mechanics class attendance, points, behavior, and performance.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <CommandPalette />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
