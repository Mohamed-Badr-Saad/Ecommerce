import { BadgeCheck, MessageSquareText } from "lucide-react";
import Link from "next/link";

import type { ReviewFormState } from "@/app/reviews/actions";
import type { ReviewEligibility, ReviewSummary } from "@/lib/product-reviews";
import { ProductReviewForm } from "./product-review-form";
import { ReviewStars } from "./review-stars";

type Review = { id: string; rating: number; title: string; content: string; verifiedPurchase: boolean; adminReply: string | null; createdAt: Date; author: string };

const dateFormat = new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeZone: "Africa/Cairo" });

/** Reviews section at the bottom of the product page. */
export function ProductReviews({ productTitle, productSlug, summary, reviews, eligibility, submitReview }: {
  productTitle: string;
  productSlug: string;
  summary: ReviewSummary;
  reviews: Review[];
  eligibility: ReviewEligibility;
  submitReview: (state: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
}) {
  const signInHref = `/sign-in?callbackURL=${encodeURIComponent(`/products/${productSlug}#write-review`)}`;
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 scroll-mt-32 border-t border-border pt-12 lg:mt-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,2fr)] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Customer reviews</p>
          <h2 id="reviews-heading" className="mt-3 font-heading text-4xl">What customers say</h2>
          {summary.count ? (
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <span className="font-heading text-5xl">{summary.average!.toFixed(1)}</span>
                <div>
                  <ReviewStars rating={summary.average!} />
                  <p className="mt-1 text-xs text-muted-foreground">Based on {summary.count} review{summary.count === 1 ? "" : "s"}</p>
                </div>
              </div>
              <ul className="mt-5 grid gap-1.5" aria-label="Rating breakdown">
                {([5, 4, 3, 2, 1] as const).map((stars) => {
                  const share = summary.count ? Math.round((summary.distribution[stars] / summary.count) * 100) : 0;
                  return (
                    <li key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 shrink-0 text-muted-foreground">{stars} star{stars === 1 ? "" : "s"}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-primary" style={{ width: `${share}%` }} /></span>
                      <span className="w-8 shrink-0 text-right text-muted-foreground">{summary.distribution[stars]}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">No reviews yet. Customers who receive this piece can be the first to share their thoughts.</p>
          )}

          <div id="write-review" className="mt-8 scroll-mt-32">
            {eligibility.state === "eligible" ? (
              <ProductReviewForm action={submitReview} productTitle={productTitle} />
            ) : eligibility.state === "already-reviewed" ? (
              <p className="border border-border bg-card p-4 text-sm leading-6">
                {eligibility.status === "PENDING" ? "Thank you — your review is waiting to be checked and will appear here soon." : eligibility.status === "APPROVED" ? "Thank you — your review is shown below." : "Thank you for your review."}
              </p>
            ) : eligibility.state === "signed-out" ? (
              <p className="text-sm leading-6 text-muted-foreground">Bought this piece? <Link href={signInHref} className="font-medium text-foreground underline underline-offset-4">Sign in</Link> to write a review.</p>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">Only customers who received this piece can review it — you&apos;ll be able to once your order is delivered.</p>
            )}
          </div>
        </div>

        <div>
          {reviews.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {reviews.map((review) => (
                <li key={review.id} className="py-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ReviewStars rating={review.rating} />
                    <span className="text-xs text-muted-foreground">{dateFormat.format(review.createdAt)}</span>
                  </div>
                  <h3 className="mt-3 font-medium">{review.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-foreground/85">{review.content}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{review.author}</span>
                    {review.verifiedPurchase ? <span className="inline-flex items-center gap-1 text-primary"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase</span> : null}
                  </p>
                  {review.adminReply ? (
                    <div className="mt-4 border-l-2 border-primary bg-secondary/40 px-4 py-3 text-sm leading-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Reply from Talié</p>
                      <p className="mt-1 whitespace-pre-wrap break-words">{review.adminReply}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center border border-dashed border-border px-6 text-center text-muted-foreground">
              <MessageSquareText className="size-7 text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm">Reviews will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
