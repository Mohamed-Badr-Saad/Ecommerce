import { z } from "zod";

import { prisma } from "./prisma";
import { storefrontImageUrlSchema } from "./media";

const optionalBannerDate = z.preprocess(
  (value) => value === "" || value == null ? null : value,
  z.coerce.date().nullable(),
);

export const bannerInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  subtitle: z.string().trim().max(300).optional(),
  image: storefrontImageUrlSchema,
  ctaText: z.string().trim().max(60).optional(),
  ctaLink: z.string().trim().startsWith("/").optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(false),
  startDate: optionalBannerDate,
  endDate: optionalBannerDate,
}).refine(
  ({ startDate, endDate }) => !startDate || !endDate || endDate > startDate,
  { message: "The end date must be after the start date.", path: ["endDate"] },
);

export const feedbackInputSchema = z.object({
  customerName: z.string().trim().max(80).optional().transform((value) => value || null),
  caption: z.string().trim().max(240).optional().transform((value) => value || null),
  altText: z.string().trim().max(255).optional().transform((value) => value || null),
  displayOrder: z.coerce.number().int().nonnegative().max(10_000).default(0),
  isActive: z.boolean().default(true),
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
  const [media, banners, policies, feedback] = await Promise.all([
    prisma.media.findMany({ take: 30, orderBy: { createdAt: "desc" } }),
    prisma.banner.findMany({ orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }] }),
    prisma.policyPage.findMany({ orderBy: { type: "asc" } }),
    prisma.customerFeedback.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] }),
  ]);
  return { media, banners, policies, feedback };
}

export async function getActiveBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gt: now } }] },
      ],
    },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, subtitle: true, image: true, ctaText: true, ctaLink: true },
  });
}

export async function getActiveCustomerFeedback() {
  return prisma.customerFeedback.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    take: 24,
    select: { id: true, image: true, imageWidth: true, imageHeight: true, altText: true, customerName: true, caption: true },
  });
}
