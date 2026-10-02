"use server";

import { revalidatePath } from "next/cache";

import { createProductReview, reviewInputSchema, ReviewNotAllowedError } from "@/lib/product-reviews";
import { getCurrentSession } from "@/lib/session";

export type ReviewFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** What the customer typed, so the form can be refilled after an error. */
  values?: { title: string; content: string };
};

/** Saves a customer's review of a product (waiting for approval in Admin → Reviews). */
export async function submitReviewAction(productId: string, productSlug: string, _state: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const values = { title: String(formData.get("title") ?? ""), content: String(formData.get("content") ?? "") };
  const session = await getCurrentSession();
  if (!session || session.user.banned) return { error: "Please sign in to write a review.", values };

  const parsed = reviewInputSchema.safeParse({
    rating: formData.get("rating") ?? undefined,
    title: formData.get("title") ?? undefined,
    content: formData.get("content") ?? undefined,
  });
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values };

  try {
    await createProductReview(productId, session.user.id, parsed.data);
  } catch (error) {
    if (error instanceof ReviewNotAllowedError) return { error: error.message, values };
    console.error("[reviews] Could not save review", { name: error instanceof Error ? error.name : "UnknownError" });
    return { error: "We couldn't save your review right now. Please try again in a moment.", values };
  }
  revalidatePath(`/products/${productSlug}`);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
