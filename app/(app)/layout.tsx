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
      <div className="flex min-h-screen flex-col items-center justify-center gap-5">
        <Logo />
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
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
