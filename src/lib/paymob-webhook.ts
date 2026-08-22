import type { Prisma } from "../generated/prisma/client";
import { getPaymobIntegrationId, verifyPaymobTransactionHmac } from "./paymob";
import { prisma } from "./prisma";
import { markPaymobOrderPaid, releasePaymobReservation } from "./reservations";

export class PaymobWebhookError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PaymobWebhookError";
  }
}

function recordAt(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

export async function processPaymobWebhook(body: unknown, receivedHmac: string) {
  const root = recordAt(body);
  const object = recordAt(root?.obj);
  if (!object || !verifyPaymobTransactionHmac(object, receivedHmac)) throw new PaymobWebhookError("Invalid callback signature.", 401);

  const providerOrder = recordAt(object.order);
  const merchantOrderId = providerOrder?.merchant_order_id;
  const providerOrderId = providerOrder?.id;
  const providerTransactionId = object.id;
  if (merchantOrderId == null || providerOrderId == null || providerTransactionId == null) throw new PaymobWebhookError("Incomplete callback.", 400);

  const order = await prisma.order.findUnique({
    where: { orderNumber: String(merchantOrderId) },
    include: { payments: { where: { provider: "PAYMOB" }, take: 1 } },
  });
  if (!order || !order.payments[0]) throw new PaymobWebhookError("Unknown order.", 404);

  const amountCents = Number(object.amount_cents);
  const expectedCents = Math.round(Number(order.total) * 100);
  if (
    order.currency !== String(object.currency) ||
    amountCents !== expectedCents ||
    Number(object.integration_id) !== getPaymobIntegrationId() ||
    order.payments[0].providerIntentionId !== String(providerOrderId)
  ) throw new PaymobWebhookError("Callback does not match the reserved order.", 409);

  const rawResponse = JSON.parse(JSON.stringify(object)) as Prisma.InputJsonValue;
  if (object.pending === true) return { outcome: "pending" as const, orderNumber: order.orderNumber };
  if (object.success === true) {
    await markPaymobOrderPaid(order.id, String(providerTransactionId), rawResponse);
    return { outcome: "paid" as const, orderNumber: order.orderNumber };
  }
  await releasePaymobReservation(order.id, new Date(), { providerTransactionId: String(providerTransactionId), rawResponse });
  return { outcome: "failed" as const, orderNumber: order.orderNumber };
}
