"use server";

import { redirect } from "next/navigation";

import { checkoutSchema } from "@/lib/commerce";
import { CheckoutError, createCodOrder, createPaymobOrder, getPaymobOrderForIntention, recordPaymobIntention } from "@/lib/orders";
import { createPaymobIntention, egpToCents, PaymobError } from "@/lib/paymob";
import { releasePaymobReservation } from "@/lib/reservations";
import { getCurrentSession } from "@/lib/session";

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function placeOrderAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-up?callbackURL=/checkout");
  if (session.user.banned) redirect("/sign-in?error=ACCOUNT_UNAVAILABLE");
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the highlighted delivery details.", fieldErrors: parsed.error.flatten().fieldErrors };

  if (parsed.data.paymentMethod === "COD") {
    let result: Awaited<ReturnType<typeof createCodOrder>>;
    try {
      result = await createCodOrder(parsed.data);
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
      console.error("[checkout] COD order failed", { name: error instanceof Error ? error.name : "UnknownError", code });
      return { error: error instanceof CheckoutError ? error.message : "We could not place your order. Please try again." };
    }
    redirect(`/order-confirmation/${result.orderNumber}`);
  }

  let reserved: Awaited<ReturnType<typeof createPaymobOrder>> | undefined;
  let checkoutUrl: string;
  try {
    reserved = await createPaymobOrder(parsed.data);
    const order = await getPaymobOrderForIntention(reserved.orderId);
    // Paymob requires line items to add up to the intention amount, so a coupon
    // collapses merchandise into one discounted line instead of per-item prices.
    const couponDiscount = Number(order.couponDiscount);
    const items = couponDiscount > 0
      ? [{
        name: `Talié order ${order.orderNumber}`,
        amountCents: egpToCents(Number(order.total) - Number(order.shippingCost)),
        description: `${order.items.length} item(s), code ${order.discountCode ?? ""}`.trim(),
        quantity: 1,
      }]
      : order.items.map((item) => ({
        name: item.title,
        amountCents: egpToCents(Number(item.price)),
        description: item.variantTitle || item.title,
        quantity: item.quantity,
      }));
    if (Number(order.shippingCost) > 0) items.push({ name: "Delivery", amountCents: egpToCents(Number(order.shippingCost)), description: "Talié delivery", quantity: 1 });
    const intention = await createPaymobIntention({
      amountCents: egpToCents(Number(order.total)),
      orderNumber: order.orderNumber,
      customer: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email, phone: parsed.data.phone },
      address: parsed.data,
      items,
    });
    const recorded = await recordPaymobIntention(order.id, intention.intentionOrderId, intention.metadata);
    if (recorded.count !== 1) throw new PaymobError("The payment attempt could not be recorded.");
    checkoutUrl = intention.checkoutUrl;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
    console.error("[checkout] Paymob checkout failed", { name: error instanceof Error ? error.name : "UnknownError", code, status: error instanceof PaymobError ? error.status : undefined });
    if (reserved) await releasePaymobReservation(reserved.orderId, new Date(), { restoreCartId: reserved.cartId });
    return { error: error instanceof CheckoutError ? error.message : "Online payment is temporarily unavailable. Your bag has been restored; please try again." };
  }
  redirect(checkoutUrl);
}
