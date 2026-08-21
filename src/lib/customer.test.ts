import { describe, expect, it } from "vitest";

import { addressSchema, profileSchema } from "./customer";

describe("customer input validation", () => {
  it("normalizes optional profile fields", () => {
    expect(profileSchema.parse({ name: "  Mariam Hassan  ", phone: "" })).toEqual({ name: "Mariam Hassan", phone: null });
  });

  it("rejects incomplete delivery addresses", () => {
    expect(() => addressSchema.parse({ firstName: "M", street: "x" })).toThrow();
  });
});
