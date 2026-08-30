import { z } from "zod";

import { prisma } from "./prisma";

export const customerBanSchema = z.object({ reason: z.string().trim().min(3).max(300) });
export const reviewModerationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().max(500).optional(),
}).refine((value) => value.status !== "REJECTED" || Boolean(value.rejectionReason), { message: "A rejection reason is required." });

export const storeProfileSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(2).max(160),
  supportEmail: z.email(),
  supportPhone: z.string().trim().min(8).max(30),
  currency: z.literal("EGP"),
});

export async function getAdminCustomers() {
  return prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, name: true, email: true, phone: true, banned: true, banReason: true, createdAt: true, lastLoginAt: true,
      _count: { select: { orders: true, addresses: true, reviews: true } },
      orders: { where: { paymentStatus: "PAID" }, select: { total: true } },
    },
  });
}

export async function getAdminReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { title: true, slug: true } }, customer: { select: { name: true, email: true } } },
  });
}

export async function setCustomerBan(customerId: string, banned: boolean, reason?: string) {
  const parsedReason = banned ? customerBanSchema.parse({ reason }).reason : null;
  return prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({ where: { id: customerId, role: "CUSTOMER" }, data: { banned, banReason: parsedReason, banExpires: null } });
    if (!result.count) throw new Error("Customer was not found.");
    if (banned) await tx.session.deleteMany({ where: { userId: customerId } });
    return tx.user.findUniqueOrThrow({ where: { id: customerId } });
  });
}

export async function moderateReview(reviewId: string, input: z.input<typeof reviewModerationSchema>) {
  const data = reviewModerationSchema.parse(input);
  return prisma.review.update({ where: { id: reviewId }, data: { status: data.status, rejectionReason: data.status === "REJECTED" ? data.rejectionReason : null } });
}

export async function getAdminActivity() {
  return prisma.adminActivityLog.findMany({ take: 250, orderBy: { timestamp: "desc" }, include: { admin: { select: { name: true, email: true } } } });
}

export async function getAdminAnalytics(now = new Date()) {
  const since = new Date(now); since.setMonth(since.getMonth() - 11); since.setDate(1); since.setHours(0, 0, 0, 0);
  const [paidOrders, orderStatuses, topItems, customerCount, repeatCustomers] = await Promise.all([
    prisma.order.findMany({ where: { paymentStatus: "PAID", createdAt: { gte: since } }, select: { total: true, createdAt: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.orderItem.groupBy({ by: ["productId", "title"], where: { order: { paymentStatus: "PAID" } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", orders: { some: { paymentStatus: "PAID" } } } }),
  ]);
  const months = new Map<string, { label: string; revenue: number; orders: number }>();
  for (let offset = 11; offset >= 0; offset--) { const date = new Date(now.getFullYear(), now.getMonth() - offset, 1); const key = `${date.getFullYear()}-${date.getMonth()}`; months.set(key, { label: date.toLocaleDateString("en-EG", { month: "short", year: "2-digit" }), revenue: 0, orders: 0 }); }
  for (const order of paidOrders) { const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`; const month = months.get(key); if (month) { month.revenue += Number(order.total); month.orders += 1; } }
  return { months: [...months.values()], orderStatuses, topItems, customerCount, payingCustomers: repeatCustomers, paidRevenue: paidOrders.reduce((sum, order) => sum + Number(order.total), 0) };
}

export async function getStoreProfile() {
  const setting = await prisma.storeSettings.findUnique({ where: { key: "store-profile" } });
  return storeProfileSchema.parse(setting?.value ?? { storeName: "Talié", tagline: "Crafted for the Modern Hijabi", supportEmail: "support@talie.test", supportPhone: "+20 100 000 0000", currency: "EGP" });
}

export async function saveStoreProfile(input: z.input<typeof storeProfileSchema>) {
  const value = storeProfileSchema.parse(input);
  return prisma.storeSettings.upsert({ where: { key: "store-profile" }, update: { value }, create: { key: "store-profile", value, description: "Public store identity and support contact details." } });
}
