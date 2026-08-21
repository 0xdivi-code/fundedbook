"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/components/auth/auth-provider";
import { JournalProvider } from "@/lib/store";
import { LightboxProvider } from "@/components/trades/lightbox";
import { UIProvider } from "@/components/layout/ui-provider";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Auth gate for the whole journal app. proxy.ts redirects unauthenticated
 * requests server-side; this is the client-side backstop (covers direct
 * client navigations and keeps types honest — everything below relies on
 * `useJournal`, which is scoped to the signed-in user).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 grid-pattern opacity-50" />
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px] animate-aurora" />
        </div>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {loading ? "Checking your session…" : "Redirecting to sign in…"}
        </div>
      </div>
    );
  }

  // key={user.id} → journal state is created fresh per account, so switching
  // accounts can never leak one user's trades into another's view.
  return (
    <JournalProvider key={user.id} userId={user.id}>
      <LightboxProvider>
        <UIProvider>
          <AppShell>{children}</AppShell>
        </UIProvider>
      </LightboxProvider>
    </JournalProvider>
  );
}
