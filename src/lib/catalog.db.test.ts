import { afterAll, describe, expect, it } from "vitest";

import { getCatalog, getCollection, getProduct, parseCatalogQuery } from "./catalog";
import { prisma } from "./prisma";

describe("seeded catalog queries", () => {
  afterAll(async () => prisma.$disconnect());

  it("returns a paginated catalog with database-backed facets", async () => {
    const catalog = await getCatalog(parseCatalogQuery({}));
    expect(catalog.total).toBeGreaterThanOrEqual(12);
    expect(catalog.products).toHaveLength(8);
    expect(catalog.categories.map((category) => category.slug)).toEqual(["abayas", "sets", "dresses"]);
    expect(catalog.colors.length).toBeGreaterThan(4);
  });

  it("filters products by collection, category, and stock state", async () => {
    const query = parseCatalogQuery({ category: "dresses", availability: "sold-out" });
    const catalog = await getCatalog(query, "debut-edit");
    expect(catalog.products.map((product) => product.slug)).toContain("hana-gathered-dress");
  });

  it("loads collection and product detail relations", async () => {
    const [collection, product] = await Promise.all([getCollection("occasion-edit"), getProduct("salma-satin-set")]);
    expect(collection?.name).toBe("Occasion Edit");
    expect(product?.variants.length).toBeGreaterThan(0);
    expect(product?.images[0]?.url).toMatch(/^\/products\/.+\.svg$/);
  });
});
