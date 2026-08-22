import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

export const PAYMENT_RESERVATION_MS = 60 * 60 * 1000;

export class ReservationError extends Error {}

type ReleaseOptions = {
  restoreCartId?: string;
  providerTransactionId?: string;
  rawResponse?: Prisma.InputJsonValue;
};

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
    await tx.payment.updateMany({
      where: { orderId, provider: "PAYMOB", status: "PENDING" },
      data: {
        status: "FAILED",
        failedAt: now,
        ...(options.providerTransactionId ? { providerTransactionId: options.providerTransactionId } : {}),
        ...(options.rawResponse ? { rawResponse: options.rawResponse } : {}),
      },
    });
    return true;
  }, { isolationLevel: "Serializable" });
}

export async function releaseExpiredPaymentReservations(now = new Date()) {
  const expired = await prisma.order.findMany({
    where: { paymentMethod: "PAYMOB", paymentStatus: "PENDING", reservationExpiresAt: { lte: now }, inventoryReleasedAt: null },
    select: { id: true },
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
    const payment = await tx.payment.updateMany({
      where: { orderId, provider: "PAYMOB", status: "PENDING" },
      data: { status: "PAID", providerTransactionId, rawResponse, paidAt },
    });
    if (!payment.count) {
      const duplicate = await tx.payment.findFirst({ where: { orderId, providerTransactionId, status: "PAID" } });
      if (duplicate) return tx.order.findUniqueOrThrow({ where: { id: orderId } });
      throw new ReservationError("This payment reservation was released or already processed.");
    }
    const updated = await tx.order.updateMany({
      where: { id: orderId, paymentMethod: "PAYMOB", paymentStatus: "PENDING", inventoryReleasedAt: null },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
    });
    if (!updated.count) throw new ReservationError("This payment reservation was released or already processed.");
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  }, { isolationLevel: "Serializable" });
}
