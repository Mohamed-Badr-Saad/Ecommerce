import { getStoreProfile } from "./admin-operations";
import { sendEmail } from "./email";
import { buildOrderEmail } from "./order-messages";
import { prisma } from "./prisma";
import { serverEnv } from "./server-env";

/** Link customers use to open their order (they sign in first if needed). */
export function customerOrderUrl(orderNumber: string) {
  return new URL(`/order-confirmation/${encodeURIComponent(orderNumber)}`, serverEnv.NEXT_PUBLIC_APP_URL).toString();
}

/**
 * Emails the customer about the order's current status (placed, preparing, shipped,
 * delivered or cancelled). Safe to call after every change: it never throws, and Resend
 * sends each order + status combination only once.
 */
export async function sendOrderUpdateEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order?.customerEmail) return { delivered: false as const, reason: "no-order" as const };
    const message = buildOrderEmail(order, customerOrderUrl(order.orderNumber));
    const profile = await getStoreProfile().catch(() => null);
    return await sendEmail({
      to: order.customerEmail,
      subject: message.subject,
      html: message.html,
      text: message.text,
      idempotencyKey: `order-${order.id}-${order.status.toLowerCase()}`,
      // Replies go to the store's support address, unless it is still the placeholder.
      replyTo: profile?.supportEmail && !/\.(test|example)$/i.test(profile.supportEmail) ? profile.supportEmail : undefined,
    });
  } catch (error) {
    console.error("[orders] Could not send the order email", { name: error instanceof Error ? error.name : "UnknownError" });
    return { delivered: false as const, reason: "error" as const };
  }
}
