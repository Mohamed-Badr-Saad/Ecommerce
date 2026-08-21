import { describe, expect, it } from "vitest";

import { FREE_SHIPPING_THRESHOLD, calculateShipping, checkoutSchema } from "./commerce";

describe("checkout rules", () => {
  it("uses the configured Egyptian delivery zones", () => {
    expect(calculateShipping(1000, "Cairo")).toBe(85);
    expect(calculateShipping(1000, "Alexandria")).toBe(110);
    expect(calculateShipping(1000, "Aswan")).toBe(140);
  });

  it("makes delivery complimentary at the storefront threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD, "Aswan")).toBe(0);
  });

  it("accepts an Egyptian COD delivery address", () => {
    expect(checkoutSchema.safeParse({ firstName: "Mariam", lastName: "Hassan", email: "mariam@example.com", phone: "01012345678", street: "12 Nile Street", city: "Dokki", governorate: "Giza" }).success).toBe(true);
  });

  it("rejects unsupported locations and malformed mobile numbers", () => {
    const result = checkoutSchema.safeParse({ firstName: "Mariam", lastName: "Hassan", email: "mariam@example.com", phone: "123", street: "12 Nile Street", city: "Dokki", governorate: "London" });
    expect(result.success).toBe(false);
  });
});
