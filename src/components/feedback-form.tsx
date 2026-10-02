"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, LoaderCircle, Star } from "lucide-react";

import { submitFeedbackAction, type FeedbackFormState } from "@/app/feedback/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

/** Homepage "Share your feedback" form. Messages are saved and appear in Admin → Feedback. */
export function FeedbackForm() {
  // Changing the key gives a fresh, empty form after "Share more feedback".
  const [round, setRound] = useState(0);
  return <FeedbackFormBody key={round} onAgain={() => setRound((value) => value + 1)} />;
}

function FeedbackFormBody({ onAgain }: { onAgain: () => void }) {
  const [state, action, pending] = useActionState<FeedbackFormState, FormData>(submitFeedbackAction, {});
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (state.ok) {
    return (
      <div role="status" className="mx-auto mt-10 max-w-xl border border-border bg-card px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto size-9 text-primary" aria-hidden="true" />
        <p className="mt-4 font-heading text-3xl">Thank you for sharing</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your feedback reached our team and helps us improve every new collection.</p>
        <Button type="button" variant="outline" className="mt-6 rounded-none" onClick={onAgain}>Share more feedback</Button>
      </div>
    );
  }

  const shown = hovered || rating;
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  return (
    <form action={action} className="mx-auto mt-10 grid max-w-xl gap-5 text-left">
      <fieldset>
        <legend className="text-sm font-medium">How was your Talié experience?</legend>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer p-1" onMouseEnter={() => setHovered(value)}>
              <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="sr-only" required />
              <Star className={`size-7 transition-colors ${value <= shown ? "fill-primary text-primary" : "text-muted-foreground/50"}`} aria-hidden="true" />
              <span className="sr-only">{value} star{value === 1 ? "" : "s"}</span>
            </label>
          ))}
        </div>
        {fieldError("rating") ? <p className="mt-1 text-xs text-destructive">{fieldError("rating")}</p> : null}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="feedback-name">Name</Label>
          <Input id="feedback-name" name="name" defaultValue={state.values?.name} autoComplete="name" maxLength={80} className="h-12 rounded-none bg-card" aria-invalid={Boolean(fieldError("name"))} />
          {fieldError("name") ? <p className="text-xs text-destructive">{fieldError("name")}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback-email">Email (optional)</Label>
          <Input id="feedback-email" name="email" type="email" defaultValue={state.values?.email} autoComplete="email" maxLength={160} className="h-12 rounded-none bg-card" aria-invalid={Boolean(fieldError("email"))} />
          {fieldError("email") ? <p className="text-xs text-destructive">{fieldError("email")}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-message">Your feedback</Label>
        <Textarea id="feedback-message" name="message" defaultValue={state.values?.message} required minLength={5} maxLength={1000} placeholder="Tell us about the fit, fabric, delivery, or anything else." className="min-h-32 rounded-none bg-card" aria-invalid={Boolean(fieldError("message"))} />
        {fieldError("message") ? <p className="text-xs text-destructive">{fieldError("message")}</p> : null}
      </div>
      {/* Spam trap: hidden from people, often filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="feedback-website">Website</label>
        <input id="feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state.error ? <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 rounded-none">{pending ? <LoaderCircle className="animate-spin" /> : null}Send feedback</Button>
    </form>
  );
}
