import { z } from "zod";

import { prisma } from "./prisma";

/**
 * Product reviews written by customers on the product page. Only customers who received
 * the product (an order containing it marked Delivered) can review it, once per product.
 * New reviews wait for approval in Admin → Reviews before they appear.
 */

export const reviewInputSchema = z.object({
  rating: z.coerce.number({ error: "Choose a star rating." }).int().min(1, "Choose a star rating.").max(5, "Choose a star rating."),
  title: z.string({ error: "Give your review a short title." }).trim().min(3, "Give your review a short title.").max(120, "Keep the title under 120 characters."),
  content: z.string({ error: "Tell others what you think." }).trim().min(10, "Write at least a sentence about the piece.").max(2000, "Keep it under 2,000 characters."),
});

export type ReviewInput = z.input<typeof reviewInputSchema>;

/** "Mariam Hassan" → "Mariam H." so full names aren't shown publicly. */
export function reviewerDisplayName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Talié customer";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase()}.`;
}

export type ReviewSummary = { average: number | null; count: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> };

/** Approved reviews for a product (newest first) plus the average and star breakdown. */
export async function getProductReviews(productId: string) {
  const [reviews, grouped] = await Promise.all([
    prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, rating: true, title: true, content: true, verifiedPurchase: true, adminReply: true, createdAt: true, customer: { select: { name: true } } },
    }),
    prisma.review.groupBy({ by: ["rating"], where: { productId, status: "APPROVED" }, _count: { _all: true } }),
  ]);
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let total = 0;
  for (const row of grouped) {
    const stars = Math.min(5, Math.max(1, row.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[stars] += row._count._all;
    count += row._count._all;
    total += row.rating * row._count._all;
  }
  const summary: ReviewSummary = { average: count ? total / count : null, count, distribution };
  return {
    summary,
    reviews: reviews.map(({ customer, ...review }) => ({ ...review, author: reviewerDisplayName(customer.name) })),
  };
}

export type ReviewEligibility =
  | { state: "signed-out" }
  | { state: "not-purchased" }
  | { state: "already-reviewed"; status: "PENDING" | "APPROVED" | "REJECTED" }
  | { state: "eligible"; orderId: string };

/** Whether this customer may write a review for this product right now. */
export async function getReviewEligibility(productId: string, userId: string | null | undefined): Promise<ReviewEligibility> {
  if (!userId) return { state: "signed-out" };
  const [existing, deliveredOrder] = await Promise.all([
    prisma.review.findFirst({ where: { productId, customerId: userId }, orderBy: { createdAt: "desc" }, select: { status: true } }),
    prisma.order.findFirst({
      where: { userId, status: "DELIVERED", items: { some: { productId } } },
      orderBy: { deliveredAt: "desc" },
      select: { id: true },
    }),
  ]);
  if (existing) return { state: "already-reviewed", status: existing.status };
  if (!deliveredOrder) return { state: "not-purchased" };
  return { state: "eligible", orderId: deliveredOrder.id };
}

export class ReviewNotAllowedError extends Error {}

export async function createProductReview(productId: string, userId: string, input: ReviewInput) {
  const data = reviewInputSchema.parse(input);
  const eligibility = await getReviewEligibility(productId, userId);
  if (eligibility.state === "already-reviewed") throw new ReviewNotAllowedError("You've already reviewed this piece — thank you!");
  if (eligibility.state !== "eligible") throw new ReviewNotAllowedError("Only customers who received this piece can review it.");
  return prisma.review.create({
    data: {
      productId,
      customerId: userId,
      orderId: eligibility.orderId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      verifiedPurchase: true,
      status: "PENDING",
    },
  });
}

export async function countPendingReviews() {
  return prisma.review.count({ where: { status: "PENDING" } });
}

export const adminReplySchema = z.object({ reply: z.string().trim().max(1000, "Keep the reply under 1,000 characters.") });

/** Saves (or clears, when empty) the store's public reply under a review. */
export async function setAdminReply(reviewId: string, reply: string) {
  const { reply: text } = adminReplySchema.parse({ reply });
  return prisma.review.update({ where: { id: reviewId }, data: { adminReply: text || null, adminReplyDate: text ? new Date() : null } });
}
