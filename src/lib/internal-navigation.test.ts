import { describe, expect, it } from "vitest";

import { safeInternalPath } from "./internal-navigation";

describe("safeInternalPath", () => {
  it.each([
    ["/account", "/account"],
    ["/admin/orders?status=paid#latest", "/admin/orders?status=paid#latest"],
    ["/products/leila-evening-abaya", "/products/leila-evening-abaya"],
  ])("keeps an internal destination", (input, expected) => {
    expect(safeInternalPath(input)).toBe(expected);
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "/%5cattacker.example",
    "/%2fattacker.example",
    "/account\nhttps://attacker.example",
    "javascript:alert(1)",
  ])("rejects unsafe destination %s", (input) => {
    expect(safeInternalPath(input)).toBe("/account");
  });
});
