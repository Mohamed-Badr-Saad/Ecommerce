import { describe, expect, it } from "vitest";

import { AdminAuthorizationError, assertAdminAccess } from "./admin";

describe("admin authorization", () => {
  it("allows an active user with an administrator role", () => {
    expect(assertAdminAccess({ role: "ADMIN", adminRole: "CONTENT_MANAGER", banned: false }).adminRole).toBe("CONTENT_MANAGER");
  });

  it("rejects customers, incomplete admin records, and banned administrators", () => {
    expect(() => assertAdminAccess({ role: "CUSTOMER", adminRole: null, banned: false })).toThrow(AdminAuthorizationError);
    expect(() => assertAdminAccess({ role: "ADMIN", adminRole: null, banned: false })).toThrow(AdminAuthorizationError);
    expect(() => assertAdminAccess({ role: "ADMIN", adminRole: "ADMIN", banned: true })).toThrow(AdminAuthorizationError);
  });
});
