import type { Prisma } from "../generated/prisma/client";
import { getPaymobIntegrationId, inquirePaymobTransactions, parseMatchingPaymobInquiryTransaction } from "./paymob";
import { prisma } from "./prisma";
import { markPaymobOrderPaid, recordPaymobAttempt } from "./reservations";

export async function reconcilePaymobOrderPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { where: { provider: "PAYMOB" }, take: 1 } },
  });
  const payment = order?.payments[0];
  if (!order || !payment?.providerIntentionId || order.paymentMethod !== "PAYMOB" || order.paymentStatus === "PAID") {
    return order?.paymentStatus ?? null;
  }

  const responses = await inquirePaymobTransactions(payment.providerIntentionId);
  const expected = {
    providerOrderId: payment.providerIntentionId,
    orderNumber: order.orderNumber,
    amountCents: Math.round(Number(order.total) * 100),
    currency: order.currency,
    integrationId: getPaymobIntegrationId(),
  };

  for (const response of responses) {
    const transaction = parseMatchingPaymobInquiryTransaction(response, expected);
    if (!transaction) continue;
    const rawResponse = JSON.parse(JSON.stringify(transaction)) as Prisma.InputJsonValue;
    if (transaction.success && !transaction.pending) {
      await markPaymobOrderPaid(order.id, String(transaction.id), rawResponse);
      return "PAID";
    }
    await recordPaymobAttempt(order.id, String(transaction.id), transaction.pending ? "PENDING" : "FAILED", rawResponse);
  }
  return order.paymentStatus;
}
