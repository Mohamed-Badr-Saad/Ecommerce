import { z } from "zod";

import type { Prisma } from "../generated/prisma/client";
import type { AdminRole, UserRole } from "../generated/prisma/enums";
import { prisma } from "./prisma";

export class AdminAuthorizationError extends Error {}

type AdminAccessUser = {
  role?: UserRole | null;
  adminRole?: AdminRole | null;
  banned?: boolean | null;
};

export function hasAdminAccess(user: AdminAccessUser | null | undefined) {
  return Boolean(user && !user.banned && user.role === "ADMIN" && user.adminRole);
}

export function assertAdminAccess(user: AdminAccessUser) {
  if (!hasAdminAccess(user)) throw new AdminAuthorizationError("Administrator access is required.");
  return user;
}

const activitySchema = z.object({
  action: z.string().trim().min(2).max(80),
  entityType: z.string().trim().min(2).max(80),
  entityId: z.string().trim().max(120).optional(),
  details: z.record(z.string(), z.json()).optional(),
  ipAddress: z.string().trim().max(64).optional(),
});

export async function logAdminActivity(adminId: string, input: z.input<typeof activitySchema>) {
  const data = activitySchema.parse(input);
  const admin = await prisma.user.findFirst({ where: { id: adminId, role: "ADMIN", banned: false }, select: { id: true } });
  if (!admin) throw new AdminAuthorizationError("Administrator access is required.");
  return prisma.adminActivityLog.create({ data: { adminId, ...data, details: data.details as Prisma.InputJsonValue | undefined } });
}

export async function getAdminDashboard() {
  const lowStockThreshold = 5;
  const [revenue, orderCount, ordersToPrepare, customerCount, activeProducts, lowStockCount, recentOrders, lowStockVariants, recentActivity] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PROCESSING"] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.productVariant.count({ where: { stockQuantity: { lte: lowStockThreshold }, product: { status: "ACTIVE" } } }),
    prisma.order.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, customerName: true, total: true, status: true, paymentStatus: true, createdAt: true } }),
    prisma.productVariant.findMany({ where: { stockQuantity: { lte: lowStockThreshold }, product: { status: "ACTIVE" } }, take: 6, orderBy: [{ stockQuantity: "asc" }, { updatedAt: "desc" }], select: { id: true, title: true, sku: true, stockQuantity: true, product: { select: { title: true } } } }),
    prisma.adminActivityLog.findMany({ take: 8, orderBy: { timestamp: "desc" }, select: { id: true, action: true, entityType: true, timestamp: true, admin: { select: { name: true } } } }),
  ]);

  return {
    metrics: {
      paidRevenue: Number(revenue._sum.total ?? 0),
      orderCount,
      ordersToPrepare,
      customerCount,
      activeProducts,
      lowStockCount,
    },
    recentOrders,
    lowStockVariants,
    recentActivity,
  };
}
