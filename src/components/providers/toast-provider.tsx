"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
  action?: ToastAction;
}

interface ToastOptions {
  tone?: "success" | "info" | "error";
  action?: ToastAction;
  duration?: number;
}

const ToastContext = createContext<{ show: (message: string, opts?: ToastOptions) => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, opts?: ToastOptions) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, tone: opts?.tone ?? "success", action: opts?.action }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, opts?.duration ?? 4500);
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <CheckCircle2
              size={16}
              className="shrink-0"
              style={{ color: t.tone === "error" ? "var(--state-absent)" : "var(--brand)" }}
            />
            <span className="max-w-[260px]">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="font-semibold"
                style={{ color: "var(--brand)" }}
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ color: "var(--text-faint)" }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
