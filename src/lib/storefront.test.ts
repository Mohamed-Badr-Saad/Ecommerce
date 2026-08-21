import { describe, expect, it } from "vitest";

import { collections, featuredProducts, formatEgp } from "./storefront";

describe("storefront presentation data", () => {
  it("formats whole Egyptian-pound prices consistently", () => {
    const formatted = formatEgp(2190);

    expect(formatted).toContain("EGP");
    expect(formatted).toContain("2,190");
    expect(formatted).not.toContain(".00");
  });

  it("keeps all fixture slugs unique", () => {
    const slugs = [
      ...collections.map((collection) => collection.slug),
      ...featuredProducts.map((product) => product.slug),
    ];

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never exposes a sale price above its comparison price", () => {
    for (const product of featuredProducts) {
      if (product.compareAtPrice !== undefined) {
        expect(product.price).toBeLessThan(product.compareAtPrice);
      }
    }
  });
});
