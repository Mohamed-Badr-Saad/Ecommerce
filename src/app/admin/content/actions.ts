"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { bannerInputSchema, policyInputSchema } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

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

export async function updatePolicyAction(policyId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = policyInputSchema.parse(Object.fromEntries(formData));
  const policy = await prisma.policyPage.update({ where: { id: policyId }, data });
  await logAdminActivity(session.user.id, { action: "updated policy", entityType: "policy", entityId: policy.id, details: { type: policy.type } });
  revalidatePath("/admin/content");
}
