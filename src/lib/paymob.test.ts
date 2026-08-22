import { afterEach, describe, expect, it } from "vitest";

import { egpToCents, verifyPaymobTransactionHmac } from "./paymob";

const originalHmacSecret = process.env.PAYMOB_HMAC_SECRET;

afterEach(() => {
  process.env.PAYMOB_HMAC_SECRET = originalHmacSecret;
});

describe("Paymob payment helpers", () => {
  it("converts EGP to Paymob's smallest currency unit", () => {
    expect(egpToCents(2290)).toBe(229000);
    expect(egpToCents(85.25)).toBe(8525);
  });

  it("verifies the documented transaction callback field order", () => {
    process.env.PAYMOB_HMAC_SECRET = "unit-test-secret";
    const object = {
      amount_cents: 100,
      created_at: "2020-03-25T18:39:44.719228",
      currency: "EGP",
      error_occured: false,
      has_parent_transaction: false,
      id: 2556706,
      integration_id: 6741,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 4778239 },
      owner: 4705,
      pending: false,
      source_data: { pan: 2346, sub_type: "MasterCard", type: "card" },
      success: true,
    };
    const hmac = "02abc7582314e0b3518fb4639971bf3898060ec52855493f50a0c568edfbc768e553be429e478e4cbae718d54049766e51418ec44b8072a20f901887d0d00b19";
    expect(verifyPaymobTransactionHmac(object, hmac)).toBe(true);
    expect(verifyPaymobTransactionHmac({ ...object, amount_cents: 101 }, hmac)).toBe(false);
  });
});
