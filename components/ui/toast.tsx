"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const ToastContext = React.createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border border-primary/15 bg-[linear-gradient(160deg,rgba(0,245,160,0.06)_0%,rgba(12,21,18,0.97)_45%,rgba(6,11,9,0.98)_100%)] backdrop-blur-xl p-3.5 shadow-[0_22px_60px_-22px_rgba(0,0,0,0.9)]",
                t.variant === "success" && "border-profit/25",
                t.variant === "error" && "border-loss/25",
                t.variant === "info" && "border-border"
              )}
            >
              {t.variant === "success" && (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-profit" />
              )}
              {t.variant === "error" && (
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
              )}
              {t.variant === "info" && (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium leading-tight">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
