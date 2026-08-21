"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AuthResult {
  error?: string;
  /** True when sign-up succeeded but the user must confirm their email first. */
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True until the initial session check has completed. */
  loading: boolean;
  /** False when NEXT_PUBLIC_SUPABASE_* env vars are missing. */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map raw Supabase errors to friendly, actionable messages. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Incorrect email or password. Double-check both and try again.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox for the confirmation link.";
  if (m.includes("user already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("password should be at least"))
    return "Password is too short — use at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "That doesn't look like a valid email address.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Could not reach Supabase. Check your internet connection and project URL.";
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // When Supabase isn't configured there is nothing to wait for.
  const [loading, setLoading] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = createClient();

    // Initial session load.
    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => {
        setSession(current);
        setUser(current?.user ?? null);
      })
      .finally(() => setLoading(false));

    // Keep state in sync (sign in, sign out, token refresh, email confirm).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      setSession(current);
      setUser(current?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: friendlyAuthError(error.message) };
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Where the confirmation email link lands.
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/confirm`
            : undefined,
      },
    });
    if (error) return { error: friendlyAuthError(error.message) };
    // No session → email confirmation is enabled on the project.
    if (!data.session) return { needsConfirmation: true };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Derive a display name / initials from the user's email. */
export function initialsFromEmail(email: string | undefined | null): string {
  if (!email) return "FB";
  const [name] = email.split("@");
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "FB";
}
