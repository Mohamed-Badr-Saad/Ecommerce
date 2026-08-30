import { z } from "zod";

import { prisma } from "./prisma";
import { storefrontImageUrlSchema } from "./media";

export const bannerInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  subtitle: z.string().trim().max(300).optional(),
  image: storefrontImageUrlSchema,
  ctaText: z.string().trim().max(60).optional(),
  ctaLink: z.string().trim().startsWith("/").optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(false),
});

export const policyInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  content: z.string().trim().min(20).max(50_000),
});

export const mediaMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  url: z.url(),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif|avif)$/i),
  size: z.number().int().positive().max(6 * 1024 * 1024),
  altText: z.string().trim().min(1).max(255),
  folder: z.string().trim().min(1).max(100),
  uploadedBy: z.string().min(1),
});

export async function getAdminContent() {
  const [media, banners, policies] = await Promise.all([
    prisma.media.findMany({ take: 30, orderBy: { createdAt: "desc" } }),
    prisma.banner.findMany({ orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }] }),
    prisma.policyPage.findMany({ orderBy: { type: "asc" } }),
  ]);
  return { media, banners, policies };
}
