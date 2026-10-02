import { z } from "zod";

import { HOMEPAGE_CONTENT_CACHE_TAG, storefrontCache } from "./cache-tags";
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

/** Active banners (with their schedule), cached; refreshed whenever a banner is saved. */
const getCachedBanners = storefrontCache(
  async () =>
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, subtitle: true, image: true, ctaText: true, ctaLink: true, startDate: true, endDate: true },
    }),
  "active-banners",
  HOMEPAGE_CONTENT_CACHE_TAG,
);

/** Banners to show right now. The schedule is checked on every visit, so timed banners start and stop on time. */
export async function getActiveBanners(now = new Date()) {
  const banners = await getCachedBanners();
  // Cached values come back with dates as text, so compare as timestamps.
  const time = (value: Date | string | null) => (value === null ? null : new Date(value).getTime());
  return banners
    .filter((banner) => {
      const start = time(banner.startDate);
      const end = time(banner.endDate);
      return (start === null || start <= now.getTime()) && (end === null || end > now.getTime());
    })
    .map(({ id, title, subtitle, image, ctaText, ctaLink }) => ({ id, title, subtitle, image, ctaText, ctaLink }));
}

/** Customer screenshots for the homepage, cached; refreshed whenever feedback is saved. */
export const getActiveCustomerFeedback = storefrontCache(
  async () =>
    prisma.customerFeedback.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 24,
      select: { id: true, image: true, imageWidth: true, imageHeight: true, altText: true, customerName: true, caption: true },
    }),
  "active-customer-feedback",
  HOMEPAGE_CONTENT_CACHE_TAG,
);
