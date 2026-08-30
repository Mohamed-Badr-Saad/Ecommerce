import { afterAll, describe, expect, it } from "vitest";

import { getCatalog, getCollection, getProduct, parseCatalogQuery } from "./catalog";
import { prisma } from "./prisma";

describe("seeded catalog queries", () => {
  afterAll(async () => prisma.$disconnect());

  it("returns a paginated catalog with database-backed facets", async () => {
    const catalog = await getCatalog(parseCatalogQuery({}));
    expect(catalog.total).toBeGreaterThanOrEqual(12);
    expect(catalog.products).toHaveLength(8);
    expect(catalog.categories.map((category) => category.slug)).toEqual(expect.arrayContaining(["abayas", "sets", "dresses"]));
    expect(catalog.colors.length).toBeGreaterThan(4);
  });

  it("filters products by collection, category, and stock state", async () => {
    const query = parseCatalogQuery({ category: "dresses", availability: "sold-out" });
    const catalog = await getCatalog(query, "debut-edit");
    expect(catalog.products.map((product) => product.slug)).toContain("hana-gathered-dress");
  });

  it("filters the customer shop by editorial collection", async () => {
    const fixture = await prisma.product.findFirst({
      where: { status: "ACTIVE", collections: { some: { isActive: true } } },
      select: { slug: true, title: true, collections: { where: { isActive: true }, select: { slug: true }, take: 1 } },
    });
    expect(fixture).not.toBeNull();
    const catalog = await getCatalog(parseCatalogQuery({ collection: fixture!.collections[0]!.slug, q: fixture!.title }));
    expect(catalog.products.map((product) => product.slug)).toContain(fixture!.slug);
  });

  it("loads collection and product detail relations", async () => {
    const [collection, product] = await Promise.all([getCollection("occasion-edit"), getProduct("salma-satin-set")]);
    expect(collection?.name).toBe("Occasion Edit");
    expect(product?.variants.length).toBeGreaterThan(0);
    expect(product?.images[0]?.url).toMatch(/^\/products\/.+\.svg$/);
  });
});
