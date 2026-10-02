import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { ReviewStars } from "@/components/review-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminReviews } from "@/lib/admin-operations";
import { countPendingReviews } from "@/lib/product-reviews";
import { cn } from "@/lib/utils";
import { moderateReviewAction, replyToReviewAction } from "../operations-actions";

export const metadata = { title: "Reviews | Admin" };

const dateFormat = new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const filter = show === "all" ? "all" : "pending";
  const [reviews, pending] = await Promise.all([getAdminReviews(filter), countPendingReviews()]);

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Customers</p>
      <h2 className="mt-3 font-heading text-5xl">Reviews</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">Customers can review a piece after their order is delivered. Approve a review to show it on the product page, or reject it. You can also add a public reply.</p>

      <nav aria-label="Filter reviews" className="mt-8 flex gap-2">
        {([["pending", `Waiting for approval (${pending})`], ["all", "All reviews"]] as const).map(([value, label]) => (
          <Link key={value} href={value === "pending" ? "/admin/reviews" : "/admin/reviews?show=all"} aria-current={filter === value ? "page" : undefined} className={cn("border px-4 py-2 text-sm transition-colors", filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary")}>{label}</Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-4">
        {reviews.length ? reviews.map((review) => (
          <Card key={review.id} className={cn("rounded-none", review.status === "PENDING" && "border-primary/50")}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <ReviewStars rating={review.rating} />
                  <CardTitle className="mt-2 text-lg">{review.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.customer.name} · <Link href={`/products/${review.product.slug}#reviews`} className="hover:underline">{review.product.title}</Link> · {dateFormat.format(review.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {review.verifiedPurchase ? <Badge variant="outline" className="rounded-none"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase</Badge> : null}
                  <Badge className={cn("rounded-none", review.status === "REJECTED" && "bg-destructive")}>{review.status === "PENDING" ? "waiting" : review.status.toLowerCase()}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="whitespace-pre-wrap break-words leading-7">{review.content}</p>
              {review.status === "REJECTED" && review.rejectionReason ? <p className="text-xs text-muted-foreground">Rejected because: {review.rejectionReason}</p> : null}
              <div className="flex flex-wrap gap-2">
                {review.status !== "APPROVED" ? <form action={moderateReviewAction.bind(null, review.id, "APPROVED")}><Button size="sm" className="rounded-none">Approve</Button></form> : null}
                {review.status !== "REJECTED" ? (
                  <form action={moderateReviewAction.bind(null, review.id, "REJECTED")} className="flex flex-wrap gap-2">
                    <Input name="rejectionReason" placeholder="Reason for rejecting (only you see this)" required className="h-9 w-64 max-w-full rounded-none" />
                    <Button size="sm" variant="outline" className="rounded-none">Reject</Button>
                  </form>
                ) : null}
              </div>
              <form action={replyToReviewAction.bind(null, review.id)} className="grid gap-2 border-t pt-4">
                <label htmlFor={`reply-${review.id}`} className="text-sm font-medium">Public reply from Talié <span className="font-normal text-muted-foreground">(optional, shown under the review)</span></label>
                <Textarea id={`reply-${review.id}`} name="reply" defaultValue={review.adminReply ?? ""} maxLength={1000} placeholder="Thank you so much for your kind words!" className="min-h-20 rounded-none" />
                <Button size="sm" variant="outline" className="w-fit rounded-none">{review.adminReply ? "Update reply" : "Save reply"}</Button>
              </form>
            </CardContent>
          </Card>
        )) : (
          <Card className="rounded-none">
            <CardContent className="py-14 text-center text-muted-foreground">{filter === "pending" ? "No reviews are waiting for approval." : "No reviews have been submitted yet."}</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
