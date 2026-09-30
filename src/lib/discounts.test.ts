import { describe, expect, it } from "vitest";

import { calculateCouponAmount, discountCodeInputSchema, discountStatus, evaluateDiscount, normalizeDiscountCode, type DiscountRule } from "./discounts";

const now = new Date("2026-10-01T12:00:00Z");
const rule = (overrides: Partial<DiscountRule> = {}): DiscountRule => ({
  code: "WELCOME10", type: "PERCENTAGE", value: 10, minSubtotal: null, maxDiscount: null,
  usageLimit: null, perCustomerLimit: null, startsAt: null, endsAt: null, isActive: true, ...overrides,
});
const unused = { totalUses: 0, customerUses: 0 };

describe("discount codes", () => {
  it("normalizes customer input", () => {
    expect(normalizeDiscountCode("  welcome 10 ")).toBe("WELCOME10");
  });

  it("calculates percentage and fixed amounts, capped and rounded", () => {
    expect(calculateCouponAmount(rule(), 1990)).toBe(199);
    expect(calculateCouponAmount(rule({ value: 15 }), 333.33)).toBe(50);
    expect(calculateCouponAmount(rule({ value: 50, maxDiscount: 300 }), 2000)).toBe(300);
    expect(calculateCouponAmount(rule({ type: "FIXED_AMOUNT", value: 250 }), 1200)).toBe(250);
    expect(calculateCouponAmount(rule({ type: "FIXED_AMOUNT", value: 500 }), 400)).toBe(400);
  });

  it("accepts a valid code", () => {
    expect(evaluateDiscount(rule(), 1000, unused, now)).toEqual({ ok: true, code: "WELCOME10", amount: 100 });
  });

  it("rejects inactive, scheduled and expired codes", () => {
    expect(evaluateDiscount(rule({ isActive: false }), 1000, unused, now).ok).toBe(false);
    expect(evaluateDiscount(rule({ startsAt: new Date("2026-10-02") }), 1000, unused, now)).toMatchObject({ ok: false, reason: "This code is not active yet." });
    expect(evaluateDiscount(rule({ endsAt: new Date("2026-10-01T12:00:00Z") }), 1000, unused, now)).toMatchObject({ ok: false, reason: "This code has expired." });
  });

  it("enforces usage limits and minimum spend", () => {
    expect(evaluateDiscount(rule({ usageLimit: 5 }), 1000, { totalUses: 5, customerUses: 0 }, now).ok).toBe(false);
    expect(evaluateDiscount(rule({ perCustomerLimit: 1 }), 1000, { totalUses: 3, customerUses: 1 }, now)).toMatchObject({ ok: false, reason: "You have already used this code." });
    expect(evaluateDiscount(rule({ perCustomerLimit: 1 }), 1000, { totalUses: 3, customerUses: 1 }, now, false).ok).toBe(true);
    expect(evaluateDiscount(rule({ minSubtotal: 1500 }), 1499, unused, now).ok).toBe(false);
    expect(evaluateDiscount(rule({ minSubtotal: 1500 }), 1500, unused, now).ok).toBe(true);
  });

  it("validates admin input", () => {
    const valid = discountCodeInputSchema.safeParse({ code: "eid-25", type: "PERCENTAGE", value: "25", maxDiscount: "", usageLimit: "100", startsAt: "", endsAt: "", isActive: true });
    expect(valid.success && valid.data).toMatchObject({ code: "EID-25", value: 25, maxDiscount: null, usageLimit: 100, description: null });
    expect(discountCodeInputSchema.safeParse({ code: "BIG", type: "PERCENTAGE", value: "120" }).success).toBe(false);
    expect(discountCodeInputSchema.safeParse({ code: "x", type: "FIXED_AMOUNT", value: "10" }).success).toBe(false);
    expect(discountCodeInputSchema.safeParse({ code: "LATE", type: "FIXED_AMOUNT", value: "10", startsAt: "2026-10-10", endsAt: "2026-10-01" }).success).toBe(false);
  });

  it("summarizes status for the admin list", () => {
    expect(discountStatus(rule(), 0, now)).toBe("active");
    expect(discountStatus(rule({ usageLimit: 2 }), 2, now)).toBe("used up");
    expect(discountStatus(rule({ startsAt: new Date("2026-11-01") }), 0, now)).toBe("scheduled");
    expect(discountStatus(rule({ isActive: false }), 0, now)).toBe("inactive");
  });
});
