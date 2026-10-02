"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { cancelUnpaidOrder, markOrderDelivered, markOrderProcessing, markOrderShipped, shipmentInputSchema } from "@/lib/admin-orders";
import { sendOrderUpdateEmail } from "@/lib/order-notifications";
import { requireAdminSession } from "@/lib/session";

async function record(orderId: string, action: string, mutate: () => Promise<unknown>) {
  const session = await requireAdminSession();
  await mutate();
  await logAdminActivity(session.user.id, { action, entityType: "order", entityId: orderId });
  // Tell the customer about the new status by email (skipped when email isn't set up).
  await sendOrderUpdateEmail(orderId);
  revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${orderId}`);
}

export async function processOrderAction(orderId: string) { await record(orderId, "started order processing", () => markOrderProcessing(orderId)); }
export async function deliverOrderAction(orderId: string) { await record(orderId, "marked order delivered", () => markOrderDelivered(orderId)); }
export async function cancelOrderAction(orderId: string) { await record(orderId, "cancelled unpaid order", () => cancelUnpaidOrder(orderId)); }
export async function shipOrderAction(orderId: string, formData: FormData) {
  const input = shipmentInputSchema.parse(Object.fromEntries(formData));
  await record(orderId, "shipped order", () => markOrderShipped(orderId, input));
}
