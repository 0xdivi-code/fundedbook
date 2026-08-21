"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/components/auth/auth-provider";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient futuristic backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-[0.55]" />
        <div className="absolute left-1/2 top-[-18%] h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-primary/12 blur-[150px] animate-aurora" />
        <div className="absolute bottom-[-22%] left-[8%] h-[380px] w-[520px] rounded-full bg-lemon/8 blur-[150px] animate-aurora" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,245,160,0.55),rgba(215,255,62,0.4),transparent)]" />
      </div>

      <div className="relative w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="gradient-border panel-glass relative overflow-hidden rounded-2xl p-6 shadow-float sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/12 blur-[70px]"
          />
          <div className="relative">{children}</div>
        </div>

        <p className="mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted-foreground/60">
          Encrypted · Private · Yours
        </p>
      </div>
    </div>
  );
}
