/** Pure rules for what a customer may do with an unpaid online order. */

export function storedCheckoutUrl(rawResponse: unknown) {
  if (typeof rawResponse !== "object" || rawResponse === null || Array.isArray(rawResponse)) return null;
  const url = (rawResponse as Record<string, unknown>).checkoutUrl;
  return typeof url === "string" && url.startsWith("https://accept.paymob.com/") ? url : null;
}

/** What the customer may do with a pending Paymob order. Pure, so the UI and actions agree. */
export function pendingPaymentOptions(order: { paymentMethod: string; paymentStatus: string; inventoryReleasedAt: Date | null; reservationExpiresAt: Date | null; payments?: { rawResponse: unknown }[] }, now = new Date()) {
  const pending = order.paymentMethod === "PAYMOB" && order.paymentStatus === "PENDING" && !order.inventoryReleasedAt;
  const windowOpen = Boolean(order.reservationExpiresAt && order.reservationExpiresAt > now);
  return {
    pending,
    canResume: pending && windowOpen && Boolean(storedCheckoutUrl(order.payments?.[0]?.rawResponse)),
    canSwitchToCod: pending,
    canCancel: pending,
  };
}
