"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { customerBanSchema, moderateReview, reviewModerationSchema, saveStoreProfile, setCustomerBan, storeProfileSchema } from "@/lib/admin-operations";
import { requireAdminSession } from "@/lib/session";
import { parseShippingForm, saveShippingSettings, SHIPPING_SETTING_KEY, ShippingSettingsError } from "@/lib/shipping";
import { parseSocialLinksForm, saveSocialLinks, SOCIAL_LINKS_SETTING_KEY, SocialLinkError } from "@/lib/social-links";
import { refreshStoreSetting } from "@/lib/store-settings";

export async function setCustomerBanAction(customerId: string, banned: boolean, formData: FormData) {
  const session = await requireAdminSession();
  const reason = banned ? customerBanSchema.parse(Object.fromEntries(formData)).reason : null;
  await setCustomerBan(customerId, banned, reason ?? undefined);
  await logAdminActivity(session.user.id, { action: banned ? "suspended customer" : "restored customer", entityType: "customer", entityId: customerId, details: reason ? { reason } : undefined });
  revalidatePath("/admin/customers");
}

export async function moderateReviewAction(reviewId: string, status: "APPROVED" | "REJECTED", formData: FormData) {
  const session = await requireAdminSession();
  const data = reviewModerationSchema.parse({ status, rejectionReason: formData.get("rejectionReason") || undefined });
  const review = await moderateReview(reviewId, data);
  await logAdminActivity(session.user.id, { action: `${status.toLowerCase()} review`, entityType: "review", entityId: review.id });
  revalidatePath("/admin/reviews"); revalidatePath("/products/[slug]", "page");
}

export async function saveStoreProfileAction(formData: FormData) {
  const session = await requireAdminSession();
  const input = storeProfileSchema.parse(Object.fromEntries(formData));
  await saveStoreProfile(input);
  await logAdminActivity(session.user.id, { action: "updated store profile", entityType: "settings", entityId: "store-profile" });
  revalidatePath("/admin/settings"); revalidatePath("/");
}

export type ShippingFormState = { error?: string; saved?: boolean };

export async function saveShippingSettingsAction(_state: ShippingFormState, formData: FormData): Promise<ShippingFormState> {
  const session = await requireAdminSession();
  let settings: ReturnType<typeof parseShippingForm>;
  try {
    settings = parseShippingForm(formData);
  } catch (error) {
    return { error: error instanceof ShippingSettingsError ? error.message : "Check the delivery fees and try again." };
  }
  await saveShippingSettings(settings);
  refreshStoreSetting(SHIPPING_SETTING_KEY);
  await logAdminActivity(session.user.id, {
    action: "updated delivery settings",
    entityType: "settings",
    entityId: "shipping",
    details: { freeShippingThreshold: settings.freeShippingThreshold },
  });
  revalidatePath("/admin/settings"); revalidatePath("/cart"); revalidatePath("/checkout");
  return { saved: true };
}

export type SocialLinksFormState = { error?: string; saved?: boolean };

export async function saveSocialLinksAction(_state: SocialLinksFormState, formData: FormData): Promise<SocialLinksFormState> {
  const session = await requireAdminSession();
  let links: ReturnType<typeof parseSocialLinksForm>;
  try {
    links = parseSocialLinksForm(formData);
  } catch (error) {
    return { error: error instanceof SocialLinkError ? error.message : "Check the links and try again." };
  }
  await saveSocialLinks(links);
  refreshStoreSetting(SOCIAL_LINKS_SETTING_KEY);
  await logAdminActivity(session.user.id, { action: "updated social media links", entityType: "settings", entityId: "social-links", details: { accounts: Object.keys(links) } });
  // The footer is on every page.
  revalidatePath("/", "layout");
  return { saved: true };
}
