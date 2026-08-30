import { describe, expect, it } from "vitest";

import { AdminAuthorizationError, assertAdminAccess, hasAdminAccess } from "./admin";

describe("admin authorization", () => {
  it("allows an active user with an administrator role", () => {
    expect(assertAdminAccess({ role: "ADMIN", adminRole: "CONTENT_MANAGER", banned: false }).adminRole).toBe("CONTENT_MANAGER");
    expect(hasAdminAccess({ role: "ADMIN", adminRole: "SUPER_ADMIN", banned: false })).toBe(true);
  });

  it("rejects customers, incomplete admin records, and banned administrators", () => {
    expect(() => assertAdminAccess({ role: "CUSTOMER", adminRole: null, banned: false })).toThrow(AdminAuthorizationError);
    expect(() => assertAdminAccess({ role: "ADMIN", adminRole: null, banned: false })).toThrow(AdminAuthorizationError);
    expect(() => assertAdminAccess({ role: "ADMIN", adminRole: "ADMIN", banned: true })).toThrow(AdminAuthorizationError);
    expect(hasAdminAccess({ role: "CUSTOMER", adminRole: null, banned: false })).toBe(false);
    expect(hasAdminAccess({ role: "ADMIN", adminRole: null, banned: false })).toBe(false);
    expect(hasAdminAccess({ role: "ADMIN", adminRole: "ADMIN", banned: true })).toBe(false);
    expect(hasAdminAccess(null)).toBe(false);
  });
});
