"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { safeInternalPath } from "@/lib/internal-navigation";

type Mode = "sign-in" | "sign-up" | "forgot" | "reset";

const modeContent = {
  "sign-in": { title: "Welcome back", description: "Sign in to view your saved pieces and account details." },
  "sign-up": { title: "Create your account", description: "Save favourites and move through checkout more quickly." },
  forgot: { title: "Reset your password", description: "Enter your email and we’ll prepare a secure reset link." },
  reset: { title: "Choose a new password", description: "Use at least eight characters for your new password." },
} as const;

export function AuthForm({ mode, callbackURL = "/account", token, resetError }: { mode: Mode; callbackURL?: string; token?: string; resetError?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    try {
      if (mode === "sign-in") {
        const result = await authClient.signIn.email({ email, password, rememberMe: true });
        if (result.error) throw new Error(result.error.message);
        router.push(safeInternalPath(callbackURL));
        router.refresh();
      } else if (mode === "sign-up") {
        if (password !== String(form.get("confirmPassword") ?? "")) throw new Error("Passwords do not match.");
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) throw new Error(result.error.message);
        router.push(safeInternalPath(callbackURL));
        router.refresh();
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw new Error(result.error.message);
        setSuccess("If an account exists for that email, we’ll send a reset link shortly. Check your inbox and spam folder.");
      } else {
        if (!token) throw new Error("This password reset link is invalid or has expired.");
        if (password !== String(form.get("confirmPassword") ?? "")) throw new Error("Passwords do not match.");
        const result = await authClient.resetPassword({ token, newPassword: password });
        if (result.error) throw new Error(result.error.message);
        setSuccess("Your password has been updated. You can now sign in.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const content = modeContent[mode];
  return (
    <div className="w-full max-w-md">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Your Talié account</p>
      <h1 className="mt-4 font-heading text-5xl leading-none tracking-[-0.04em]">{content.title}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{content.description}</p>

      {mode === "reset" && resetError ? <p role="alert" className="mt-6 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">This password reset link is invalid or has expired. Request a new link to continue.</p> : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" aria-describedby={mode === "reset" ? "password-requirements" : undefined}>
        {mode === "sign-up" ? <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" autoComplete="name" className="h-12 rounded-none bg-card" required minLength={2} /></div> : null}
        {mode !== "reset" ? <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" className="h-12 rounded-none bg-card" required /></div> : null}
        {mode === "sign-in" || mode === "sign-up" || mode === "reset" ? <div className="space-y-2"><Label htmlFor="password">{mode === "reset" ? "New password" : "Password"}</Label><Input id="password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="h-12 rounded-none bg-card" required minLength={8} maxLength={128} /></div> : null}
        {mode === "reset" ? <p id="password-requirements" className="text-sm text-muted-foreground">Use 8–128 characters and avoid reusing a password from another account.</p> : null}
        {mode === "sign-up" || mode === "reset" ? <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="h-12 rounded-none bg-card" required minLength={8} maxLength={128} /></div> : null}
        {error ? <p role="alert" className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        {success ? <p role="status" className="border border-primary/20 bg-secondary px-4 py-3 text-sm leading-6">{success}</p> : null}
        <Button type="submit" className="h-12 w-full rounded-none" disabled={pending || (mode === "reset" && Boolean(resetError))}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</Button>
      </form>

      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
        {mode === "sign-in" ? <><Link href="/forgot-password" className="text-muted-foreground hover:underline">Forgot password?</Link><Link href="/sign-up" className="font-medium hover:underline">Create an account</Link></> : null}
        {mode === "sign-up" ? <p className="text-muted-foreground">Already registered? <Link href="/sign-in" className="font-medium text-foreground hover:underline">Sign in</Link></p> : null}
        {mode === "forgot" || mode === "reset" ? <Link href="/sign-in" className="font-medium hover:underline">Return to sign in</Link> : null}
        {mode === "reset" && resetError ? <Link href="/forgot-password" className="font-medium hover:underline">Request a new link</Link> : null}
      </div>
    </div>
  );
}
