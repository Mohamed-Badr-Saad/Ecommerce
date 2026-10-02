"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { bannerInputSchema, feedbackInputSchema, policyInputSchema } from "@/lib/admin-content";
import { storefrontImageUrlSchema } from "@/lib/media";
import { addAnnouncement, ANNOUNCEMENTS_SETTING_KEY, deleteAnnouncement, toggleAnnouncement, updateAnnouncement } from "@/lib/announcements";
import { refreshStoreSetting } from "@/lib/store-settings";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { getSupabaseAdminClient, supabaseStorageBucket } from "@/lib/supabase-admin";

export async function createBannerAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = bannerInputSchema.parse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  const banner = await prisma.banner.create({ data });
  await logAdminActivity(session.user.id, { action: "created banner", entityType: "banner", entityId: banner.id, details: { title: banner.title } });
  revalidatePath("/admin/content"); revalidatePath("/");
}

export async function toggleBannerAction(bannerId: string) {
  const session = await requireAdminSession();
  const current = await prisma.banner.findUniqueOrThrow({ where: { id: bannerId } });
  const banner = await prisma.banner.update({ where: { id: bannerId }, data: { isActive: !current.isActive } });
  await logAdminActivity(session.user.id, { action: banner.isActive ? "activated banner" : "deactivated banner", entityType: "banner", entityId: banner.id });
  revalidatePath("/admin/content"); revalidatePath("/");
}

export async function updateBannerAction(bannerId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = bannerInputSchema.parse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  const banner = await prisma.banner.update({ where: { id: bannerId }, data });
  await logAdminActivity(session.user.id, { action: "updated banner", entityType: "banner", entityId: banner.id, details: { title: banner.title } });
  revalidatePath("/admin/content"); revalidatePath("/");
}

export async function deleteBannerAction(bannerId: string) {
  const session = await requireAdminSession();
  const banner = await prisma.banner.delete({ where: { id: bannerId } });
  await logAdminActivity(session.user.id, { action: "deleted banner", entityType: "banner", entityId: banner.id, details: { title: banner.title } });
  revalidatePath("/admin/content"); revalidatePath("/");
}

export async function updateMediaAction(mediaId: string, formData: FormData) {
  const session = await requireAdminSession();
  const altText = String(formData.get("altText") ?? "").trim();
  if (!altText || altText.length > 255) throw new Error("Alt text must be between 1 and 255 characters.");
  const media = await prisma.media.update({ where: { id: mediaId }, data: { altText } });
  await logAdminActivity(session.user.id, { action: "updated media", entityType: "media", entityId: media.id, details: { altText } });
  revalidatePath("/admin/content");
}

export async function deleteMediaAction(mediaId: string) {
  const session = await requireAdminSession();
  const media = await prisma.media.findUniqueOrThrow({ where: { id: mediaId } });
  const [productImages, banners, categories, collections, variants, feedback] = await Promise.all([
    prisma.productImage.count({ where: { url: media.url } }),
    prisma.banner.count({ where: { image: media.url } }),
    prisma.category.count({ where: { image: media.url } }),
    prisma.productCollection.count({ where: { image: media.url } }),
    prisma.productVariant.count({ where: { image: media.url } }),
    prisma.customerFeedback.count({ where: { image: media.url } }),
  ]);
  if (productImages + banners + categories + collections + variants + feedback > 0) throw new Error("Remove this image from all catalog, banner, and customer feedback records before deleting it from the media library.");
  const marker = `/storage/v1/object/public/${supabaseStorageBucket}/`;
  const pathname = new URL(media.url).pathname;
  if (pathname.startsWith(marker)) {
    const objectPath = pathname.slice(marker.length).split("/").map(decodeURIComponent).join("/");
    const { error } = await getSupabaseAdminClient().storage.from(supabaseStorageBucket).remove([objectPath]);
    if (error) throw new Error(`Supabase could not delete this image: ${error.message}`);
  }
  await prisma.media.delete({ where: { id: mediaId } });
  await logAdminActivity(session.user.id, { action: "deleted media", entityType: "media", entityId: media.id, details: { filename: media.filename } });
  revalidatePath("/admin/content");
}

export async function updatePolicyAction(policyId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = policyInputSchema.parse(Object.fromEntries(formData));
  const policy = await prisma.policyPage.update({ where: { id: policyId }, data });
  await logAdminActivity(session.user.id, { action: "updated policy", entityType: "policy", entityId: policy.id, details: { type: policy.type } });
  revalidatePath("/admin/content");
}

function parseFeedbackForm(formData: FormData) {
  return feedbackInputSchema.parse({
    customerName: formData.get("customerName") ?? undefined,
    caption: formData.get("caption") ?? undefined,
    altText: formData.get("altText") ?? undefined,
    displayOrder: formData.get("displayOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
}

function refreshFeedback() {
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function createFeedbackAction(formData: FormData) {
  const session = await requireAdminSession();
  const urls = Array.from(new Set(formData.getAll("image").map(String).filter(Boolean))).map((url) => storefrontImageUrlSchema.parse(url));
  if (!urls.length) throw new Error("Upload at least one feedback screenshot first.");
  const data = parseFeedbackForm(formData);
  const media = await prisma.media.findMany({ where: { url: { in: urls } }, select: { url: true, width: true, height: true, altText: true } });
  const byUrl = new Map(media.map((item) => [item.url, item]));
  const created = await prisma.$transaction(urls.map((url, index) => prisma.customerFeedback.create({
    data: {
      ...data,
      image: url,
      imageWidth: byUrl.get(url)?.width ?? null,
      imageHeight: byUrl.get(url)?.height ?? null,
      altText: data.altText ?? byUrl.get(url)?.altText ?? null,
      displayOrder: data.displayOrder + index,
    },
  })));
  await logAdminActivity(session.user.id, { action: "added customer feedback", entityType: "customer_feedback", details: { count: created.length } });
  refreshFeedback();
}

export async function updateFeedbackAction(feedbackId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = parseFeedbackForm(formData);
  const feedback = await prisma.customerFeedback.update({ where: { id: feedbackId }, data });
  await logAdminActivity(session.user.id, { action: "updated customer feedback", entityType: "customer_feedback", entityId: feedback.id });
  refreshFeedback();
}

export async function toggleFeedbackAction(feedbackId: string) {
  const session = await requireAdminSession();
  const current = await prisma.customerFeedback.findUniqueOrThrow({ where: { id: feedbackId } });
  const feedback = await prisma.customerFeedback.update({ where: { id: feedbackId }, data: { isActive: !current.isActive } });
  await logAdminActivity(session.user.id, { action: feedback.isActive ? "showed customer feedback" : "hid customer feedback", entityType: "customer_feedback", entityId: feedback.id });
  refreshFeedback();
}

export async function deleteFeedbackAction(feedbackId: string) {
  const session = await requireAdminSession();
  const feedback = await prisma.customerFeedback.delete({ where: { id: feedbackId } });
  await logAdminActivity(session.user.id, { action: "deleted customer feedback", entityType: "customer_feedback", entityId: feedback.id });
  refreshFeedback();
}

function announcementForm(formData: FormData) {
  return {
    text: String(formData.get("text") ?? ""),
    link: String(formData.get("link") ?? ""),
    position: formData.get("position") || 0,
    isActive: formData.get("isActive") === "on",
  };
}

function refreshAnnouncements() {
  refreshStoreSetting(ANNOUNCEMENTS_SETTING_KEY);
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

export async function createAnnouncementAction(formData: FormData) {
  const session = await requireAdminSession();
  const created = await addAnnouncement(announcementForm(formData));
  await logAdminActivity(session.user.id, { action: "added announcement", entityType: "announcement", entityId: created.id, details: { text: created.text } });
  refreshAnnouncements();
}

export async function updateAnnouncementAction(announcementId: string, formData: FormData) {
  const session = await requireAdminSession();
  await updateAnnouncement(announcementId, announcementForm(formData));
  await logAdminActivity(session.user.id, { action: "updated announcement", entityType: "announcement", entityId: announcementId });
  refreshAnnouncements();
}

export async function toggleAnnouncementAction(announcementId: string) {
  const session = await requireAdminSession();
  const isActive = await toggleAnnouncement(announcementId);
  await logAdminActivity(session.user.id, { action: isActive ? "showed announcement" : "hid announcement", entityType: "announcement", entityId: announcementId });
  refreshAnnouncements();
}

export async function deleteAnnouncementAction(announcementId: string) {
  const session = await requireAdminSession();
  await deleteAnnouncement(announcementId);
  await logAdminActivity(session.user.id, { action: "deleted announcement", entityType: "announcement", entityId: announcementId });
  refreshAnnouncements();
}
