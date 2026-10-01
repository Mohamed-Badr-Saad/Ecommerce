"use server";

import { redirect } from "next/navigation";

import { checkoutSchema } from "@/lib/commerce";
import { CheckoutError, createCodOrder } from "@/lib/orders";
import { getCurrentSession } from "@/lib/session";

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string[]> };

/** Places a cash-on-delivery order (the only payment option in this release). */
export async function placeOrderAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-up?callbackURL=/checkout");
  if (session.user.banned) redirect("/sign-in?error=ACCOUNT_UNAVAILABLE");
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the highlighted delivery details.", fieldErrors: parsed.error.flatten().fieldErrors };

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
