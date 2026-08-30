import { z } from "zod";

import { prisma } from "./prisma";

export const shipmentInputSchema = z.object({
  trackingNumber: z.string().trim().min(2).max(120),
  trackingUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function getAdminOrders() {
  return prisma.order.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, customerName: true, customerEmail: true, total: true, status: true, paymentStatus: true, paymentMethod: true, createdAt: true, _count: { select: { items: true } } },
  });
}

export async function getAdminOrder(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: { include: { attempts: { orderBy: { processedAt: "desc" } } } }, user: { select: { id: true, name: true, email: true } } } });
}

export async function markOrderProcessing(orderId: string) {
  const updated = await prisma.order.updateMany({ where: { id: orderId, status: { in: ["CONFIRMED", "PENDING"] }, OR: [{ paymentMethod: "COD" }, { paymentStatus: "PAID" }] }, data: { status: "PROCESSING" } });
  if (!updated.count) throw new Error("Only confirmed COD or paid online orders can be processed.");
  return prisma.order.findUniqueOrThrow({ where: { id: orderId } });
}

export async function markOrderShipped(orderId: string, input: z.input<typeof shipmentInputSchema>, now = new Date()) {
  const data = shipmentInputSchema.parse(input);
  const updated = await prisma.order.updateMany({ where: { id: orderId, status: "PROCESSING" }, data: { status: "SHIPPED", shippedAt: now, trackingNumber: data.trackingNumber, trackingUrl: data.trackingUrl || null } });
  if (!updated.count) throw new Error("Only processing orders can be shipped.");
  return prisma.order.findUniqueOrThrow({ where: { id: orderId } });
}

export async function markOrderDelivered(orderId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id: orderId, status: "SHIPPED" }, data: { status: "DELIVERED", deliveredAt: now, ...(await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { paymentMethod: true } })).paymentMethod === "COD" ? { paymentStatus: "PAID" } : {} } });
    if (!updated.count) throw new Error("Only shipped orders can be delivered.");
    if ((await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { paymentMethod: true } })).paymentMethod === "COD") await tx.payment.updateMany({ where: { orderId, provider: "COD" }, data: { status: "PAID", paidAt: now } });
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

export async function cancelUnpaidOrder(orderId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (["CANCELLED", "REFUNDED"].includes(order.status)) return order;
    if (order.paymentStatus === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED") throw new Error("Paid or dispatched orders require a refund workflow.");
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
    }
    await tx.payment.updateMany({ where: { orderId, status: { not: "PAID" } }, data: { status: "FAILED", failedAt: now } });
    return tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", paymentStatus: order.paymentMethod === "COD" ? "UNPAID" : "FAILED", cancelledAt: now, inventoryReleasedAt: now } });
  }, { isolationLevel: "Serializable" });
}
