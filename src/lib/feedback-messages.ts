import { createHmac } from "node:crypto";

import { z } from "zod";

import { prisma } from "./prisma";
import { serverEnv } from "./server-env";

/** Messages from the homepage "Share your feedback" form, read by the admin in Admin → Feedback. */

export const MAX_FEEDBACK_PER_HOUR = 5;

const optionalText = (max: number) =>
  z.preprocess((value) => (typeof value === "string" ? value.trim() : value) || undefined, z.string().max(max).optional());

export const feedbackMessageSchema = z.object({
  rating: z.coerce.number({ error: "Choose a star rating." }).int().min(1, "Choose a star rating.").max(5, "Choose a star rating."),
  name: optionalText(80),
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value) || undefined,
    z.email("Enter a valid email address, or leave it empty.").max(160).optional(),
  ),
  message: z.string({ error: "Write a short message." }).trim().min(5, "Write at least a few words.").max(1000, "Keep it under 1,000 characters."),
});

export type FeedbackMessageInput = z.input<typeof feedbackMessageSchema>;

export class FeedbackLimitError extends Error {}

/** Keyed hash of the sender's IP, used only to limit repeat submissions. The IP itself is never stored. */
export function hashIp(ip: string | null | undefined) {
  if (!ip) return null;
  return createHmac("sha256", serverEnv.BETTER_AUTH_SECRET).update(`feedback:${ip}`).digest("hex").slice(0, 32);
}

export async function createFeedbackMessage(input: FeedbackMessageInput, { userId, ip, now = new Date() }: { userId?: string | null; ip?: string | null; now?: Date }) {
  const data = feedbackMessageSchema.parse(input);
  const ipHash = hashIp(ip);
  const since = new Date(now.getTime() - 60 * 60 * 1000);
  const sender = [ipHash ? { ipHash } : null, userId ? { userId } : null].filter((item): item is { ipHash: string } | { userId: string } => item !== null);
  if (sender.length) {
    const recent = await prisma.feedbackMessage.count({ where: { createdAt: { gt: since }, OR: sender } });
    if (recent >= MAX_FEEDBACK_PER_HOUR) throw new FeedbackLimitError("Thank you! You've sent several messages already — please try again a little later.");
  }
  return prisma.feedbackMessage.create({
    data: { rating: data.rating, name: data.name ?? null, email: data.email ?? null, message: data.message, userId: userId ?? null, ipHash },
  });
}

export type FeedbackFilter = "unread" | "all";

export async function getFeedbackMessages(filter: FeedbackFilter = "all") {
  return prisma.feedbackMessage.findMany({
    where: filter === "unread" ? { isRead: false } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, rating: true, name: true, email: true, message: true, isRead: true, createdAt: true, user: { select: { name: true, email: true } } },
  });
}

export async function getFeedbackSummary() {
  const [unread, total, average] = await Promise.all([
    prisma.feedbackMessage.count({ where: { isRead: false } }),
    prisma.feedbackMessage.count(),
    prisma.feedbackMessage.aggregate({ _avg: { rating: true } }),
  ]);
  return { unread, total, averageRating: average._avg.rating };
}

export async function countUnreadFeedback() {
  return prisma.feedbackMessage.count({ where: { isRead: false } });
}

export async function setFeedbackRead(id: string, isRead: boolean) {
  return prisma.feedbackMessage.updateMany({ where: { id }, data: { isRead } });
}

export async function markAllFeedbackRead() {
  return prisma.feedbackMessage.updateMany({ where: { isRead: false }, data: { isRead: true } });
}

export async function deleteFeedbackMessage(id: string) {
  return prisma.feedbackMessage.deleteMany({ where: { id } });
}
