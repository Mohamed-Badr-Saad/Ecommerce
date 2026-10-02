"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createFeedbackMessage, FeedbackLimitError, feedbackMessageSchema } from "@/lib/feedback-messages";
import { getCurrentSession } from "@/lib/session";

export type FeedbackFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** What the customer typed, so the form can be refilled after an error. */
  values?: { name: string; email: string; message: string };
};

/** Saves a message from the homepage "Share your feedback" form. */
export async function submitFeedbackAction(_state: FeedbackFormState, formData: FormData): Promise<FeedbackFormState> {
  // Hidden "website" field: people never see it, simple spam bots fill it in. Pretend it worked.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), message: String(formData.get("message") ?? "") };
  const parsed = feedbackMessageSchema.safeParse({
    rating: formData.get("rating") ?? undefined,
    name: formData.get("name") ?? undefined,
    email: formData.get("email") ?? undefined,
    message: formData.get("message") ?? undefined,
  });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values };

  const [session, requestHeaders] = await Promise.all([getCurrentSession(), headers()]);
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
  try {
    await createFeedbackMessage(parsed.data, { userId: session?.user.banned ? null : session?.user.id, ip });
  } catch (error) {
    if (error instanceof FeedbackLimitError) return { error: error.message, values };
    console.error("[feedback] Could not save feedback", { name: error instanceof Error ? error.name : "UnknownError" });
    return { error: "We couldn't send your feedback right now. Please try again in a moment.", values };
  }
  revalidatePath("/admin/feedback");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
