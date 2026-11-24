"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface FloatingPanelProps {
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}

/**
 * Dropdown panel rendered in a portal with `position: fixed`, so it is never
 * clipped by `overflow-hidden` ancestors (e.g. the live roster list).
 * Opens upward automatically when there is not enough space below the trigger.
 * Closes on scroll, resize, Escape, or outside click.
 */
export function FloatingPanel({ anchorRef, onClose, width = 176, children }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const rect = anchor.getBoundingClientRect();
    const panelHeight = panel.offsetHeight || 300;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelHeight + gap && rect.top > panelHeight + gap;
    const top = openUp ? Math.max(8, rect.top - panelHeight - gap) : rect.bottom + gap;
    const left = Math.min(Math.max(8, rect.right - width), Math.max(8, window.innerWidth - width - 8));
    setStyle({ visibility: "visible", top, left });
  }, [anchorRef, width]);

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      className="animate-fade-in rounded-lg border shadow-lg"
      style={{
        position: "fixed",
        width,
        zIndex: 60,
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-lg)",
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
