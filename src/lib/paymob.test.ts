import { afterEach, describe, expect, it } from "vitest";

import { egpToCents, normalizePaymobInquiryResponse, parseMatchingPaymobInquiryTransaction, verifyPaymobTransactionHmac } from "./paymob";

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

  it("accepts only authenticated inquiry transactions that exactly match the reserved order", () => {
    const transaction = {
      id: 520072771,
      success: true,
      pending: false,
      amount_cents: 358000,
      currency: "EGP",
      integration_id: 5878118,
      is_live: false,
      order: { id: 592604857, merchant_order_id: "TL-260822-D85A3C" },
    };
    const expected = {
      providerOrderId: "592604857",
      orderNumber: "TL-260822-D85A3C",
      amountCents: 358000,
      currency: "EGP",
      integrationId: 5878118,
    };

    expect(parseMatchingPaymobInquiryTransaction(transaction, expected)?.success).toBe(true);
    expect(parseMatchingPaymobInquiryTransaction({ ...transaction, amount_cents: 357999 }, expected)).toBeNull();
    expect(parseMatchingPaymobInquiryTransaction({ ...transaction, order: { ...transaction.order, merchant_order_id: "another-order" } }, expected)).toBeNull();
    expect(normalizePaymobInquiryResponse(transaction)).toEqual([transaction]);
    expect(normalizePaymobInquiryResponse({ results: [transaction] })).toEqual([transaction]);
  });
});
