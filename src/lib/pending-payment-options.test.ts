import { describe, expect, it } from "vitest";

import { pendingPaymentOptions, storedCheckoutUrl } from "./pending-payment-options";

const now = new Date("2026-10-01T12:00:00Z");
const checkoutUrl = "https://accept.paymob.com/unifiedcheckout/?publicKey=pk&clientSecret=cs";
const order = (overrides = {}) => ({
  paymentMethod: "PAYMOB", paymentStatus: "PENDING", inventoryReleasedAt: null,
  reservationExpiresAt: new Date("2026-10-01T12:30:00Z"), payments: [{ rawResponse: { checkoutUrl } }], ...overrides,
});

describe("pending online payments", () => {
  it("only trusts stored Paymob checkout links", () => {
    expect(storedCheckoutUrl({ checkoutUrl })).toBe(checkoutUrl);
    expect(storedCheckoutUrl({ checkoutUrl: "https://evil.example/pay" })).toBe(null);
    expect(storedCheckoutUrl(null)).toBe(null);
  });

  it("offers every option while the reservation is open", () => {
    expect(pendingPaymentOptions(order(), now)).toEqual({ pending: true, canResume: true, canSwitchToCod: true, canCancel: true });
  });

  it("stops offering the Paymob link after the window or without a stored link", () => {
    expect(pendingPaymentOptions(order({ reservationExpiresAt: new Date("2026-10-01T11:59:00Z") }), now)).toMatchObject({ canResume: false, canSwitchToCod: true });
    expect(pendingPaymentOptions(order({ payments: [{ rawResponse: { id: "1" } }] }), now)).toMatchObject({ canResume: false, canCancel: true });
  });

  it("offers nothing for paid, COD or released orders", () => {
    expect(pendingPaymentOptions(order({ paymentStatus: "PAID" }), now).pending).toBe(false);
    expect(pendingPaymentOptions(order({ paymentMethod: "COD", paymentStatus: "UNPAID" }), now).pending).toBe(false);
    expect(pendingPaymentOptions(order({ inventoryReleasedAt: now }), now).pending).toBe(false);
  });
});
