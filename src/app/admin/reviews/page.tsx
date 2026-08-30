import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminReviews } from "@/lib/admin-operations";
import { moderateReviewAction } from "../operations-actions";

export const metadata = { title: "Reviews | Admin" };

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();
  return <section><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Community</p><h2 className="mt-3 font-heading text-5xl">Reviews</h2><p className="mt-3 text-muted-foreground">Approve helpful customer feedback and document rejections.</p><div className="mt-8 grid gap-4">{reviews.length ? reviews.map((review) => <Card key={review.id} className="rounded-none"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-lg">{review.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{review.customer.name} · <Link href={`/products/${review.product.slug}`} className="hover:underline">{review.product.title}</Link> · {review.rating}/5</p></div><Badge variant="outline" className="rounded-none">{review.status.toLowerCase()}</Badge></div></CardHeader><CardContent><p className="leading-7">{review.content}</p><div className="mt-4 flex flex-wrap gap-2"><form action={moderateReviewAction.bind(null, review.id, "APPROVED")}><Button size="sm" className="rounded-none">Approve</Button></form><form action={moderateReviewAction.bind(null, review.id, "REJECTED")} className="flex gap-2"><Input name="rejectionReason" placeholder="Rejection reason" required /><Button size="sm" variant="outline" className="rounded-none">Reject</Button></form></div></CardContent></Card>) : <Card className="rounded-none"><CardContent className="py-14 text-center text-muted-foreground">No reviews have been submitted.</CardContent></Card>}</div></section>;
}
