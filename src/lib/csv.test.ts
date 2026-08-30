import { describe, expect, it } from "vitest";

import { csvCell } from "./csv";

describe("csvCell", () => {
  it.each(["=HYPERLINK(\"https://evil.test\")", "+201234567890", "-1+1", "@SUM(A1:A2)", " \t=cmd"])("neutralizes spreadsheet formula input %s", (input) => {
    expect(csvCell(input).startsWith("\"'")).toBe(true);
  });

  it("keeps normal text and escapes CSV quotes", () => {
    expect(csvCell('Talié "Debut"')).toBe('"Talié ""Debut"""');
  });
});
