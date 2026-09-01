"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { bannerInputSchema, policyInputSchema } from "@/lib/admin-content";
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
  const [productImages, banners, categories, collections, variants] = await Promise.all([
    prisma.productImage.count({ where: { url: media.url } }),
    prisma.banner.count({ where: { image: media.url } }),
    prisma.category.count({ where: { image: media.url } }),
    prisma.productCollection.count({ where: { image: media.url } }),
    prisma.productVariant.count({ where: { image: media.url } }),
  ]);
  if (productImages + banners + categories + collections + variants > 0) throw new Error("Remove this image from all catalog and banner records before deleting it from the media library.");
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
