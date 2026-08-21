"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, MailCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthField, FormError, SetupNotice } from "@/components/auth/auth-forms";

export default function SignupPage() {
  const { signUp, configured, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /.+@.+\..+/.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = confirm.length > 0 && confirm === password;
  const valid = emailValid && passwordValid && confirmValid;

  const emailError =
    touched && !emailValid ? "Enter a valid email address." : undefined;
  const passwordError =
    touched && !passwordValid
      ? "Use at least 8 characters."
      : undefined;
  const confirmError =
    touched && !confirmValid && confirm.length > 0
      ? "Passwords don't match."
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setAwaitingConfirmation(true);
      return;
    }
    router.replace("/");
  };

  if (awaitingConfirmation) {
    return (
      <div>
        <SetupNotice />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-profit/15 text-profit">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-[22px] font-bold leading-tight">
          <span className="text-gradient-emerald">Check your inbox</span>
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email.trim()}</span>.
          Click it to activate your account, then sign in to start journaling.
        </p>
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Can&apos;t find it? Check the spam folder. Still nothing after a
          couple of minutes — try signing up again.
        </p>
        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => router.push("/login")}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <SetupNotice />

      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/70">
        New Account
      </p>
      <h1 className="mt-2 text-[24px] font-bold leading-tight">
        <span className="text-gradient">Create your journal</span>
      </h1>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">
        Free email + password account. Your journal starts empty and private —
        only your trades.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          error={emailError}
        />

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              className="h-10 bg-secondary/60 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {passwordError ? (
            <p className="text-[12px] text-loss">{passwordError}</p>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              At least 8 characters. Mix letters and numbers for a stronger one.
            </p>
          )}
        </div>

        <AuthField
          id="confirm-password"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={confirmError}
        />

        <FormError message={error} />

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={!configured || authLoading || submitting || (touched && !valid)}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
