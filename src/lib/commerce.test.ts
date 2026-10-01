import { describe, expect, it } from "vitest";

import { DEFAULT_SHIPPING_SETTINGS, calculateMerchandiseTotals, calculateShipping, checkoutSchema } from "./commerce";

describe("checkout rules", () => {
  it("uses the configured Egyptian delivery zones", () => {
    expect(calculateShipping(1000, "Cairo")).toBe(85);
    expect(calculateShipping(1000, "Alexandria")).toBe(110);
    expect(calculateShipping(1000, "Aswan")).toBe(140);
  });

  it("makes delivery complimentary at the storefront threshold", () => {
    expect(calculateShipping(2500, "Aswan")).toBe(0);
    expect(calculateShipping(2499, "Aswan")).toBe(140);
  });

  it("uses the admin's own delivery fees and free-delivery amount", () => {
    const settings = { freeShippingThreshold: 4000, rates: { ...DEFAULT_SHIPPING_SETTINGS.rates, Cairo: 60 } };
    expect(calculateShipping(3000, "Cairo", settings)).toBe(60);
    expect(calculateShipping(4000, "Cairo", settings)).toBe(0);
    expect(calculateShipping(99999, "Cairo", { ...settings, freeShippingThreshold: null })).toBe(60);
  });

  it("totals product markdowns separately from the amount due", () => {
    expect(calculateMerchandiseTotals([
      { price: 1690, compareAtPrice: 1990, quantity: 2 },
      { price: 1490, compareAtPrice: null, quantity: 1 },
    ])).toEqual({ originalSubtotal: 5470, discount: 600, subtotal: 4870 });
  });

  it("accepts an Egyptian COD delivery address", () => {
    expect(checkoutSchema.safeParse({ firstName: "Mariam", lastName: "Hassan", email: "mariam@example.com", phone: "01012345678", street: "12 Nile Street", city: "Dokki", governorate: "Giza" }).success).toBe(true);
  });

  it("rejects unsupported locations and malformed mobile numbers", () => {
    const result = checkoutSchema.safeParse({ firstName: "Mariam", lastName: "Hassan", email: "mariam@example.com", phone: "123", street: "12 Nile Street", city: "Dokki", governorate: "London" });
    expect(result.success).toBe(false);
  });
});
