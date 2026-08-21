import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "http://localhost:3000";
  const [products, collections] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.productCollection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "weekly", priority: 0.9 },
    ...collections.map((collection) => ({ url: `${baseUrl}/collections/${collection.slug}`, lastModified: collection.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
