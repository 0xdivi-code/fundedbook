"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";

/**
 * Email confirmation callback. Supabase confirmation emails land here with
 * `?token_hash=...&type=signup&next=/`. We exchange the token for a session
 * and redirect into the app.
 */
function ConfirmHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  // Derive the terminal states up-front so the effect below only contains
  // the async token exchange (setState stays in callbacks).
  const [status, setStatus] = useState<"working" | "error">(() =>
    isSupabaseConfigured && tokenHash && type ? "working" : "error"
  );
  const [message, setMessage] = useState<string>(() => {
    if (!isSupabaseConfigured)
      return "Supabase is not configured. See SUPABASE_SETUP.md.";
    if (!tokenHash || !type)
      return "This confirmation link is missing its token. Please request a new email.";
    return "Confirming your email…";
  });

  useEffect(() => {
    if (status !== "working" || !tokenHash || !type) {
      return;
    }
    const next = params.get("next") ?? "/";

    const supabase = createClient();
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as never })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setMessage(
            error.message.includes("expired")
              ? "This confirmation link has expired. Sign up again to get a fresh email."
              : `Could not confirm your email: ${error.message}`
          );
          return;
        }
        router.replace(next.startsWith("/") ? next : "/");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong while confirming your email. Please try again.");
      });
  }, [status, tokenHash, type, params, router]);

  if (status === "working") {
    return (
      <Center>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-4 text-[18px] font-semibold tracking-tight">
          {message}
        </h1>
      </Center>
    );
  }

  return (
    <Center>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-loss/15 text-loss">
        <XCircle className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-[18px] font-semibold tracking-tight">
        Confirmation failed
      </h1>
      <p className="mt-2 max-w-sm text-center text-[13px] text-muted-foreground">
        {message}
      </p>
      <Button variant="outline" className="mt-6" asChild>
        <Link href="/login">Go to sign in</Link>
      </Button>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {children}
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <Center>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Center>
      }
    >
      <ConfirmHandler />
    </Suspense>
  );
}
