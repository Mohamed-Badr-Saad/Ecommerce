import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "./prisma";

describe("Prisma PostgreSQL integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to PostgreSQL and reads the seeded catalog", async () => {
    const [categories, products] = await Promise.all([
      prisma.category.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: {
          category: true,
          images: true,
          variants: true,
        },
        orderBy: { slug: "asc" },
      }),
    ]);

    expect(categories).toBeGreaterThanOrEqual(3);
    expect(products.length).toBeGreaterThanOrEqual(12);
    expect(products.every((product) => product.images.length > 0)).toBe(true);
    expect(products.every((product) => product.variants.length > 0)).toBe(true);
    expect(products.every((product) => product.category.isActive)).toBe(true);
  });

  it("stores money as exact decimals and preserves variant SKUs", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: "safa-draped-abaya" },
      include: { variants: true },
    });

    expect(product.price.toFixed(2)).toBe("2190.00");
    expect(new Set(product.variants.map((variant) => variant.sku)).size).toBe(product.variants.length);
  });
});
