"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Star } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

// Presentation only for now: submissions are not sent or stored anywhere.
export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setRating(0);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="mx-auto mt-10 max-w-xl border border-border bg-card px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto size-9 text-primary" aria-hidden="true" />
        <p className="mt-4 font-heading text-3xl">Thank you for sharing</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your feedback helps us improve every new collection.</p>
        <Button type="button" variant="outline" className="mt-6 rounded-none" onClick={() => setSubmitted(false)}>Share more feedback</Button>
      </div>
    );
  }

  const shown = hovered || rating;
  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 grid max-w-xl gap-5 text-left">
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
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="feedback-name">Name</Label><Input id="feedback-name" name="name" autoComplete="name" maxLength={80} className="h-12 rounded-none bg-card" /></div>
        <div className="space-y-2"><Label htmlFor="feedback-email">Email (optional)</Label><Input id="feedback-email" name="email" type="email" autoComplete="email" maxLength={160} className="h-12 rounded-none bg-card" /></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-message">Your feedback</Label>
        <Textarea id="feedback-message" name="message" required minLength={5} maxLength={1000} placeholder="Tell us about the fit, fabric, delivery, or anything else." className="min-h-32 rounded-none bg-card" />
      </div>
      <Button type="submit" className="h-12 rounded-none">Send feedback</Button>
    </form>
  );
}
