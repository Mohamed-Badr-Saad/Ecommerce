"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { deleteFeedbackMessage, markAllFeedbackRead, setFeedbackRead } from "@/lib/feedback-messages";
import { requireAdminSession } from "@/lib/session";

function refresh() {
  revalidatePath("/admin/feedback");
  // The menu shows the unread count on every admin page.
  revalidatePath("/admin", "layout");
}

export async function setFeedbackReadAction(messageId: string, isRead: boolean) {
  await requireAdminSession();
  await setFeedbackRead(messageId, isRead);
  refresh();
}

export async function markAllFeedbackReadAction() {
  const session = await requireAdminSession();
  const { count } = await markAllFeedbackRead();
  await logAdminActivity(session.user.id, { action: "marked all feedback read", entityType: "feedback", details: { count } });
  refresh();
}

export async function deleteFeedbackMessageAction(messageId: string) {
  const session = await requireAdminSession();
  await deleteFeedbackMessage(messageId);
  await logAdminActivity(session.user.id, { action: "deleted feedback message", entityType: "feedback", entityId: messageId });
  refresh();
}
