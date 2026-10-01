"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cancelPendingOrderToBag, PendingPaymentError, resumePendingPayment, switchPendingOrderToCod } from "@/lib/pending-payments";
import { getCurrentSession } from "@/lib/session";

export type PendingPaymentState = { error?: string };

export async function pendingPaymentAction(orderNumber: string, _state: PendingPaymentState, formData: FormData): Promise<PendingPaymentState> {
  const session = await getCurrentSession();
  if (!session) redirect(`/sign-in?callbackURL=${encodeURIComponent("/account/orders")}`);
  if (session.user.banned) redirect("/sign-in?error=ACCOUNT_UNAVAILABLE");
  const intent = formData.get("intent");
  const userId = session.user.id;

  let destination: string;
  try {
    if (intent === "resume") {
      const result = await resumePendingPayment(orderNumber, userId);
      destination = result.paid ? `/order-confirmation/${orderNumber}` : result.checkoutUrl;
    } else if (intent === "cod") {
      await switchPendingOrderToCod(orderNumber, userId);
      destination = `/order-confirmation/${orderNumber}`;
    } else if (intent === "cancel") {
      const result = await cancelPendingOrderToBag(orderNumber, userId);
      destination = result.paid ? `/order-confirmation/${orderNumber}` : "/cart";
    } else {
      return { error: "Choose an option." };
    }
  } catch (error) {
    if (error instanceof PendingPaymentError) return { error: error.message };
    console.error("[orders] Pending payment action failed", { intent: String(intent), name: error instanceof Error ? error.name : "UnknownError" });
    return { error: "We couldn't update this order. Please try again." };
  }

  revalidatePath("/account/orders");
  revalidatePath(`/order-confirmation/${orderNumber}`);
  revalidatePath("/", "layout");
  redirect(destination);
}
