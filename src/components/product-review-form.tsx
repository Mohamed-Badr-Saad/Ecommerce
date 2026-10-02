"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, LoaderCircle, Star } from "lucide-react";

import type { ReviewFormState } from "@/app/reviews/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type SubmitReview = (state: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;

/** Write-a-review form on the product page (only shown to customers who received the piece). */
export function ProductReviewForm({ action: submit, productTitle }: { action: SubmitReview; productTitle: string }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submit, {});
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (state.ok) {
    return (
      <div role="status" className="border border-border bg-card px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto size-8 text-primary" aria-hidden="true" />
        <p className="mt-3 font-heading text-2xl">Thank you for your review</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">It will appear here once our team has checked it.</p>
      </div>
    );
  }

  const shown = hovered || rating;
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  return (
    <form action={action} className="grid gap-5 border border-border bg-card p-5 sm:p-6">
      <div>
        <p className="font-heading text-2xl">Review {productTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">You received this piece, so your review will show a &ldquo;Verified purchase&rdquo; badge.</p>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
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
      <div className="space-y-2">
        <Label htmlFor="review-title">Title</Label>
        <Input id="review-title" name="title" defaultValue={state.values?.title} required minLength={3} maxLength={120} placeholder="e.g. Beautiful drape, true to size" className="h-12 rounded-none bg-background" aria-invalid={Boolean(fieldError("title"))} />
        {fieldError("title") ? <p className="text-xs text-destructive">{fieldError("title")}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-content">Your review</Label>
        <Textarea id="review-content" name="content" defaultValue={state.values?.content} required minLength={10} maxLength={2000} placeholder="How was the fit, fabric and quality?" className="min-h-32 rounded-none bg-background" aria-invalid={Boolean(fieldError("content"))} />
        {fieldError("content") ? <p className="text-xs text-destructive">{fieldError("content")}</p> : null}
      </div>
      {state.error ? <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 rounded-none">{pending ? <LoaderCircle className="animate-spin" /> : null}Submit review</Button>
    </form>
  );
}
