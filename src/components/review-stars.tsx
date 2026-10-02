import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star rating (rounded to the nearest whole star). */
export function ReviewStars({ rating, className, size = "size-4" }: { rating: number; className?: string; size?: string }) {
  const filled = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${Number(rating.toFixed(1))} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} className={cn(size, value <= filled ? "fill-primary text-primary" : "text-muted-foreground/35")} aria-hidden="true" />
      ))}
    </span>
  );
}
