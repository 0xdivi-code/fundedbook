"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CandlestickChart, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/components/auth/auth-provider";

const HIGHLIGHTS = [
  {
    icon: LineChart,
    title: "Every trade, reviewed",
    text: "Log entries, exits, screenshots, and lessons in seconds.",
  },
  {
    icon: Sparkles,
    title: "Know your edge",
    text: "Equity curve, win rate, expectancy, and strategy stats.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "Your journal is tied to your account — no sample data, no noise.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Signed-in users shouldn't see login/signup (proxy.ts also handles this).
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/12 blur-[140px]"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card/70 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between border-r border-border bg-[#0a0b0f] p-10 lg:flex">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>

          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <CandlestickChart className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-[26px] font-bold leading-tight tracking-tight">
              The journal built for
              <span className="text-gradient"> disciplined traders.</span>
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
              FundedBook turns a simple trade log into a clear picture of what
              works, what doesn&apos;t, and what to do about it.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
                  <h.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold">
                    {h.title}
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    {h.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center bg-card/40 p-6 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
