import { prisma } from "./prisma";
import { reconcilePaymobOrderPayment } from "./paymob-reconciliation";
import { storedCheckoutUrl } from "./pending-payment-options";
import { releasePaymobReservation } from "./reservations";

export { pendingPaymentOptions } from "./pending-payment-options";

/**
 * Customer self-service for online-payment orders that are still waiting for Paymob:
 * resume the same Paymob checkout, switch to cash on delivery, or cancel and return
 * the pieces to the bag. Every action first asks Paymob whether the order was paid.
 */

export class PendingPaymentError extends Error {}

type PendingOrder = NonNullable<Awaited<ReturnType<typeof findOwnedPendingOrder>>>;

async function findOwnedPendingOrder(orderNumber: string, userId: string) {
  return prisma.order.findFirst({
    where: { orderNumber, userId, paymentMethod: "PAYMOB", paymentStatus: "PENDING", inventoryReleasedAt: null },
    include: { payments: { where: { provider: "PAYMOB" }, take: 1 } },
  });
}

/** Throws unless Paymob confirms the order is still unpaid; returns "PAID" if it was paid meanwhile. */
async function confirmStillUnpaid(order: PendingOrder) {
  if (!order.payments[0]?.providerIntentionId) return "PENDING" as const;
  let status: string | null;
  try {
    status = await reconcilePaymobOrderPayment(order.id);
  } catch {
    throw new PendingPaymentError("We couldn't confirm the payment status with Paymob. Please try again in a minute.");
  }
  return status === "PAID" ? "PAID" as const : "PENDING" as const;
}

async function requirePendingOrder(orderNumber: string, userId: string) {
  const order = await findOwnedPendingOrder(orderNumber, userId);
  if (!order) throw new PendingPaymentError("This order is no longer waiting for payment.");
  return order;
}

export async function resumePendingPayment(orderNumber: string, userId: string, now = new Date()) {
  const order = await requirePendingOrder(orderNumber, userId);
  if ((await confirmStillUnpaid(order)) === "PAID") return { paid: true as const };
  if (!order.reservationExpiresAt || order.reservationExpiresAt <= now) throw new PendingPaymentError("The payment window for this order has closed. Switch to cash on delivery or return the pieces to your bag.");
  const checkoutUrl = storedCheckoutUrl(order.payments[0]?.rawResponse);
  if (!checkoutUrl) throw new PendingPaymentError("This payment link can't be reopened. Switch to cash on delivery or return the pieces to your bag to pay again.");
  return { paid: false as const, checkoutUrl };
}

export async function switchPendingOrderToCod(orderNumber: string, userId: string, now = new Date()) {
  const order = await requirePendingOrder(orderNumber, userId);
  if ((await confirmStillUnpaid(order)) === "PAID") return { paid: true as const };
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, paymentMethod: "PAYMOB", paymentStatus: "PENDING", inventoryReleasedAt: null },
      data: { paymentMethod: "COD", paymentStatus: "UNPAID", status: "CONFIRMED", reservationExpiresAt: null },
    });
    if (claimed.count !== 1) throw new PendingPaymentError("This order is no longer waiting for payment.");
    await tx.payment.updateMany({ where: { orderId: order.id, provider: "PAYMOB", status: "PENDING" }, data: { status: "FAILED", failedAt: now } });
    await tx.payment.upsert({
      where: { idempotencyKey: `cod:${order.checkoutToken}` },
      update: {},
      create: { orderId: order.id, provider: "COD", status: "PENDING", amount: order.total, currency: order.currency, idempotencyKey: `cod:${order.checkoutToken}` },
    });
  }, { isolationLevel: "Serializable" });
  return { paid: false as const };
}

async function userCartId(userId: string) {
  const cart = await prisma.cart.upsert({ where: { userId }, update: { expiresAt: null }, create: { userId } });
  return cart.id;
}

export async function cancelPendingOrderToBag(orderNumber: string, userId: string, now = new Date()) {
  const order = await requirePendingOrder(orderNumber, userId);
  if ((await confirmStillUnpaid(order)) === "PAID") return { paid: true as const };
  const released = await releasePaymobReservation(order.id, now, { restoreCartId: await userCartId(userId) });
  if (!released) throw new PendingPaymentError("This order is no longer waiting for payment.");
  return { paid: false as const };
}

/**
 * Releases this customer's online-payment orders whose one-hour window has passed and puts
 * the pieces back in their bag. Runs when they open their orders, so it works even if the
 * reservation cron is not scheduled.
 */
export async function releaseExpiredOrdersForUser(userId: string, now = new Date()) {
  const expired = await prisma.order.findMany({
    where: { userId, paymentMethod: "PAYMOB", paymentStatus: "PENDING", inventoryReleasedAt: null, reservationExpiresAt: { lte: now } },
    select: { id: true },
    take: 10,
  });
  if (!expired.length) return 0;
  const cartId = await userCartId(userId);
  let released = 0;
  for (const order of expired) {
    try {
      const status = await reconcilePaymobOrderPayment(order.id).catch(() => null);
      if (status === "PAID") continue;
      if (await releasePaymobReservation(order.id, now, { restoreCartId: cartId })) released += 1;
    } catch (error) {
      console.error("[orders] Could not release an expired reservation", { name: error instanceof Error ? error.name : "UnknownError" });
    }
  }
  return released;
}
