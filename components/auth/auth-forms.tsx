"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Banner shown when NEXT_PUBLIC_SUPABASE_* env vars are missing. */
export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mb-6 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-[12.5px] leading-relaxed">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <p className="font-semibold text-warning">Supabase is not configured</p>
        <p className="mt-1 text-muted-foreground">
          Create a free project at{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            supabase.com
          </a>
          , copy your project URL and anon key into{" "}
          <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
            .env.local
          </code>
          , then restart the dev server. Step-by-step guide:{" "}
          <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
            SUPABASE_SETUP.md
          </code>
          .
        </p>
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className="h-10 bg-secondary/60"
      />
      {error ? (
        <p className="text-[12px] text-loss">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-loss/30 bg-loss/10 p-3 text-[12.5px] leading-relaxed text-foreground"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-loss" />
      <span>{message}</span>
    </div>
  );
}
