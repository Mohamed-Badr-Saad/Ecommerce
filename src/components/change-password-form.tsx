"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    try {
      if (newPassword !== confirmation) throw new Error("New passwords do not match.");
      if (currentPassword === newPassword) throw new Error("Choose a password different from your current password.");
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (result.error) throw new Error(result.error.message || "The password could not be changed.");
      form.reset();
      setSuccess("Password changed. Other signed-in devices have been logged out.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The password could not be changed.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="grid gap-5" aria-describedby="change-password-help">
    <p id="change-password-help" className="text-sm leading-6 text-muted-foreground">Use 8–128 characters. Changing your password signs out your other devices.</p>
    <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" minLength={8} maxLength={128} required className="h-11 rounded-none" /></div>
    <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="h-11 rounded-none" /></div>
    <div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="h-11 rounded-none" /></div>
    {error ? <p role="alert" className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
    {success ? <p role="status" className="border border-primary/20 bg-secondary px-4 py-3 text-sm">{success}</p> : null}
    <Button type="submit" disabled={pending} className="h-11 rounded-none sm:w-fit">{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}Change password</Button>
  </form>;
}
