import { describe, expect, it } from "vitest";

import { bannerInputSchema, mediaMetadataSchema, policyInputSchema } from "./admin-content";

describe("admin content validation", () => {
  it("accepts safe image metadata within the upload limit", () => {
    const media = mediaMetadataSchema.parse({ filename: "hero.webp", originalName: "Hero.webp", url: "https://example.ufs.sh/f/hero", mimeType: "image/webp", size: 512_000, altText: "Talié hero", folder: "catalog/2026/08", uploadedBy: "admin-id" });
    expect(media.mimeType).toBe("image/webp");
  });

  it("rejects non-image and oversized upload metadata", () => {
    const base = { filename: "asset", originalName: "asset", url: "https://example.com/asset", altText: "Asset", folder: "catalog/2026/08", uploadedBy: "admin-id" };
    expect(mediaMetadataSchema.safeParse({ ...base, mimeType: "application/pdf", size: 100 }).success).toBe(false);
    expect(mediaMetadataSchema.safeParse({ ...base, mimeType: "image/png", size: 6 * 1024 * 1024 + 1 }).success).toBe(false);
    expect(mediaMetadataSchema.safeParse({ ...base, mimeType: "image/svg+xml", size: 100 }).success).toBe(false);
  });

  it("validates storefront-safe banner links and substantial policy copy", () => {
    expect(bannerInputSchema.safeParse({ title: "Debut", image: "/editorial/hero.svg", ctaLink: "/shop", displayOrder: 0, isActive: true }).success).toBe(true);
    expect(bannerInputSchema.safeParse({ title: "Suit", image: "https://i.pinimg.com/example.jpg", ctaLink: "/shop" }).success).toBe(true);
    expect(bannerInputSchema.safeParse({ title: "Debut", image: "javascript:alert(1)", ctaLink: "https://outside.test" }).success).toBe(false);
    expect(bannerInputSchema.safeParse({ title: "Debut", image: "https://unapproved.example/image.jpg", ctaLink: "/shop" }).success).toBe(false);
    expect(bannerInputSchema.safeParse({ title: "Scheduled", image: "/editorial/hero.svg", startDate: "2026-09-02T10:00", endDate: "2026-09-01T10:00" }).success).toBe(false);
    expect(policyInputSchema.safeParse({ title: "Returns", content: "A clear policy with enough detail for customers." }).success).toBe(true);
  });
});
