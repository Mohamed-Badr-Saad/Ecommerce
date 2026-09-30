import { z } from "zod";

/** Pure discount-code rules. Database access lives in `discount-codes.ts`. */

export const DISCOUNT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

export function normalizeDiscountCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export const discountCodeEntrySchema = z.preprocess(
  normalizeDiscountCode,
  z.string().regex(DISCOUNT_CODE_PATTERN, "Enter a valid discount code."),
);

const optionalDecimal = z.preprocess(
  (value) => value === "" || value == null ? null : value,
  z.coerce.number().positive().max(1_000_000).nullable(),
);

const optionalCount = z.preprocess(
  (value) => value === "" || value == null ? null : value,
  z.coerce.number().int().positive().max(1_000_000).nullable(),
);

const optionalDate = z.preprocess(
  (value) => value === "" || value == null ? null : value,
  z.coerce.date().nullable(),
);

export const discountCodeInputSchema = z.object({
  code: discountCodeEntrySchema,
  description: z.string().trim().max(200).optional().transform((value) => value || null),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.coerce.number().positive().max(1_000_000),
  minSubtotal: optionalDecimal,
  maxDiscount: optionalDecimal,
  usageLimit: optionalCount,
  perCustomerLimit: optionalCount,
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().default(true),
})
  .refine(({ type, value }) => type !== "PERCENTAGE" || value <= 100, { message: "A percentage discount cannot exceed 100%.", path: ["value"] })
  .refine(({ startsAt, endsAt }) => !startsAt || !endsAt || endsAt > startsAt, { message: "The end date must be after the start date.", path: ["endsAt"] });

export type DiscountCodeInput = z.output<typeof discountCodeInputSchema>;

export type DiscountRule = {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type DiscountUsage = { totalUses: number; customerUses: number };

export type DiscountEvaluation =
  | { ok: true; code: string; amount: number }
  | { ok: false; code: string; amount: 0; reason: string };

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function calculateCouponAmount(rule: Pick<DiscountRule, "type" | "value" | "maxDiscount">, subtotal: number) {
  if (subtotal <= 0) return 0;
  const raw = rule.type === "PERCENTAGE" ? subtotal * (rule.value / 100) : rule.value;
  const capped = rule.type === "PERCENTAGE" && rule.maxDiscount ? Math.min(raw, rule.maxDiscount) : raw;
  return roundMoney(Math.max(0, Math.min(capped, subtotal)));
}

/**
 * Decides whether a code can be used for a merchandise subtotal (after sale prices).
 * `usage` counts non-cancelled orders; per-customer limits apply only when a customer is known.
 */
export function evaluateDiscount(rule: DiscountRule, subtotal: number, usage: DiscountUsage, now = new Date(), customerKnown = true): DiscountEvaluation {
  const fail = (reason: string): DiscountEvaluation => ({ ok: false, code: rule.code, amount: 0, reason });
  if (!rule.isActive) return fail("This code is no longer active.");
  if (rule.startsAt && now < rule.startsAt) return fail("This code is not active yet.");
  if (rule.endsAt && now >= rule.endsAt) return fail("This code has expired.");
  if (rule.usageLimit !== null && usage.totalUses >= rule.usageLimit) return fail("This code has reached its usage limit.");
  if (customerKnown && rule.perCustomerLimit !== null && usage.customerUses >= rule.perCustomerLimit) return fail("You have already used this code.");
  if (rule.minSubtotal !== null && subtotal < rule.minSubtotal) return fail(`Spend at least EGP ${rule.minSubtotal.toLocaleString("en-EG")} to use this code.`);
  const amount = calculateCouponAmount(rule, subtotal);
  if (amount <= 0) return fail("This code does not apply to your bag.");
  return { ok: true, code: rule.code, amount };
}

export function describeDiscount(rule: Pick<DiscountRule, "type" | "value" | "maxDiscount">) {
  if (rule.type === "PERCENTAGE") return `${rule.value}% off${rule.maxDiscount ? ` (up to EGP ${rule.maxDiscount.toLocaleString("en-EG")})` : ""}`;
  return `EGP ${rule.value.toLocaleString("en-EG")} off`;
}

export function discountStatus(rule: Pick<DiscountRule, "isActive" | "startsAt" | "endsAt" | "usageLimit">, totalUses: number, now = new Date()) {
  if (!rule.isActive) return "inactive" as const;
  if (rule.endsAt && now >= rule.endsAt) return "expired" as const;
  if (rule.usageLimit !== null && totalUses >= rule.usageLimit) return "used up" as const;
  if (rule.startsAt && now < rule.startsAt) return "scheduled" as const;
  return "active" as const;
}
