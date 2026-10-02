"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { saveSocialLinksAction, type SocialLinksFormState } from "@/app/admin/operations-actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Field = { key: string; label: string; hint: string; value: string };

/** Admin → Settings → Social media. Empty boxes hide that icon from the site. */
export function AdminSocialLinksForm({ fields }: { fields: Field[] }) {
  const [state, action, pending] = useActionState<SocialLinksFormState, FormData>(saveSocialLinksAction, {});
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="grid gap-1.5">
            <Label htmlFor={`social-${field.key}`}>{field.label}</Label>
            <Input id={`social-${field.key}`} name={field.key} defaultValue={field.value} placeholder={field.hint} autoComplete="off" className="h-11 rounded-none" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Paste the full link, or just the username (for WhatsApp, the phone number). Leave a box empty to hide that icon from the site.</p>
      {state.error ? <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      {state.saved ? <p role="status" className="border border-primary/25 bg-card p-3 text-sm">Social links saved. The icons now show at the bottom of every page.</p> : null}
      <Button type="submit" disabled={pending} className="h-11 w-fit rounded-none">{pending ? <LoaderCircle className="animate-spin" /> : null}Save social links</Button>
    </form>
  );
}
