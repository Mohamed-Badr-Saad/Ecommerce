import { describe, expect, it } from "vitest";

import { customerBanSchema, reviewModerationSchema, storeProfileSchema } from "./admin-operations";

describe("admin operations validation", () => {
  it("requires a meaningful customer suspension reason", () => {
    expect(customerBanSchema.safeParse({ reason: "Fraudulent chargeback pattern" }).success).toBe(true);
    expect(customerBanSchema.safeParse({ reason: "x" }).success).toBe(false);
  });

  it("requires a reason only when rejecting a review", () => {
    expect(reviewModerationSchema.safeParse({ status: "APPROVED" }).success).toBe(true);
    expect(reviewModerationSchema.safeParse({ status: "REJECTED" }).success).toBe(false);
    expect(reviewModerationSchema.safeParse({ status: "REJECTED", rejectionReason: "Contains private contact information" }).success).toBe(true);
  });

  it("accepts the EGP store profile and rejects unsupported currencies", () => {
    const profile = { storeName: "Talié", tagline: "Modern modest wear", supportEmail: "help@talie.test", supportPhone: "+201001234567", currency: "EGP" };
    expect(storeProfileSchema.safeParse(profile).success).toBe(true);
    expect(storeProfileSchema.safeParse({ ...profile, currency: "USD" }).success).toBe(false);
  });
});
