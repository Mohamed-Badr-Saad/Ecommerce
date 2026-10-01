import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

export const PAYMENT_RESERVATION_MS = 60 * 60 * 1000;
export const RESERVATION_CLEANUP_BATCH_SIZE = 50;

export class ReservationError extends Error {}

type ReleaseOptions = {
  restoreCartId?: string;
};

type AttemptStatus = "PENDING" | "FAILED" | "PAID";

async function savePaymobAttempt(tx: Prisma.TransactionClient, paymentId: string, providerTransactionId: string, status: AttemptStatus, rawResponse: Prisma.InputJsonValue, processedAt: Date) {
  const existing = await tx.paymentAttempt.findUnique({ where: { providerTransactionId } });
  if (existing?.paymentId !== undefined && existing.paymentId !== paymentId) throw new ReservationError("The Paymob transaction belongs to another payment.");
  if (existing?.status === "PAID" && status !== "PAID") return existing;
  return existing
    ? tx.paymentAttempt.update({ where: { id: existing.id }, data: { status, rawResponse, processedAt } })
    : tx.paymentAttempt.create({ data: { paymentId, providerTransactionId, status, rawResponse, processedAt } });
}

export async function recordPaymobAttempt(orderId: string, providerTransactionId: string, status: AttemptStatus, rawResponse: Prisma.InputJsonValue, processedAt = new Date()) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirstOrThrow({ where: { orderId, provider: "PAYMOB" } });
    return savePaymobAttempt(tx, payment.id, providerTransactionId, status, rawResponse, processedAt);
  }, { isolationLevel: "Serializable" });
}

export async function releasePaymobReservation(orderId: string, now = new Date(), options: ReleaseOptions = {}) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentMethod: "PAYMOB", paymentStatus: "PENDING", inventoryReleasedAt: null },
      data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now, inventoryReleasedAt: now },
    });
    if (!claimed.count) return false;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
      if (options.restoreCartId) {
        const lineKey = `${item.productId}:${item.variantId ?? "base"}`;
        await tx.cartItem.upsert({
          where: { cartId_lineKey: { cartId: options.restoreCartId, lineKey } },
          update: { quantity: { increment: item.quantity } },
          create: { cartId: options.restoreCartId, productId: item.productId, variantId: item.variantId, lineKey, quantity: item.quantity },
        });
      }
    }
    if (options.restoreCartId) {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { discountCodeId: true } });
      if (order?.discountCodeId) await tx.cart.update({ where: { id: options.restoreCartId }, data: { discountCodeId: order.discountCodeId } });
    }
    await tx.payment.updateMany({
      where: { orderId, provider: "PAYMOB", status: "PENDING" },
      data: {
        status: "FAILED",
        failedAt: now,
      },
    });
    return true;
  }, { isolationLevel: "Serializable" });
}

export async function releaseExpiredPaymentReservations(now = new Date(), limit = RESERVATION_CLEANUP_BATCH_SIZE) {
  const batchSize = Math.max(1, Math.min(Math.trunc(limit), RESERVATION_CLEANUP_BATCH_SIZE));
  const expired = await prisma.order.findMany({
    where: { paymentMethod: "PAYMOB", paymentStatus: "PENDING", reservationExpiresAt: { lte: now }, inventoryReleasedAt: null },
    select: { id: true },
    orderBy: [{ reservationExpiresAt: "asc" }, { id: "asc" }],
    take: batchSize,
  });
  let released = 0;
  for (const candidate of expired) {
    released += await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: candidate.id, paymentMethod: "PAYMOB", paymentStatus: "PENDING", reservationExpiresAt: { lte: now }, inventoryReleasedAt: null },
        data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: now, inventoryReleasedAt: now },
      });
      if (!claimed.count) return 0;
      const items = await tx.orderItem.findMany({ where: { orderId: candidate.id } });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
        if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
      }
      await tx.payment.updateMany({ where: { orderId: candidate.id, status: "PENDING" }, data: { status: "FAILED", failedAt: now } });
      return 1;
    }, { isolationLevel: "Serializable" });
  }
  return released;
}

export async function markPaymobOrderPaid(orderId: string, providerTransactionId: string, rawResponse: Prisma.InputJsonValue, paidAt = new Date()) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, payments: { where: { provider: "PAYMOB" }, take: 1 } },
    });
    const payment = order.payments[0];
    if (!payment) throw new ReservationError("The Paymob payment record is missing.");

    if (payment.providerTransactionId && payment.rawResponse && payment.status === "FAILED") {
      await savePaymobAttempt(tx, payment.id, payment.providerTransactionId, "FAILED", payment.rawResponse, payment.failedAt ?? paidAt);
    }
    await savePaymobAttempt(tx, payment.id, providerTransactionId, "PAID", rawResponse, paidAt);
    if (order.paymentStatus === "PAID") return order;

    if (order.inventoryReleasedAt) {
      for (const item of order.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.updateMany({ where: { id: item.variantId, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
          if (!variant.count) throw new ReservationError("Paid inventory is no longer available and requires manual review.");
        }
        const product = await tx.product.updateMany({ where: { id: item.productId, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
        if (!product.count) throw new ReservationError("Paid inventory is no longer available and requires manual review.");
      }
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", providerTransactionId, rawResponse, paidAt, failedAt: null },
    });
    // A customer may have switched to cash on delivery while a Paymob attempt was still settling.
    await tx.payment.updateMany({ where: { orderId, provider: "COD", status: "PENDING" }, data: { status: "FAILED", failedAt: paidAt } });
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "PAYMOB", inventoryReleasedAt: null, cancelledAt: null },
    });
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  }, { isolationLevel: "Serializable" });
}
