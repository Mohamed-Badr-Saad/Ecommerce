import { describe, expect, it } from "vitest";

import { catalogQueryString, parseCatalogQuery } from "./catalog";

describe("catalog query parsing", () => {
  it("normalizes invalid paging and sorting values", () => {
    expect(parseCatalogQuery({ page: "-4", sort: "random", availability: "maybe" })).toEqual({
      q: undefined,
      category: undefined,
      color: undefined,
      size: undefined,
      availability: undefined,
      sort: "newest",
      page: 1,
    });
  });

  it("preserves active filters while changing a page", () => {
    const query = parseCatalogQuery({ q: "abaya", category: "abayas", sort: "price-asc" });
    expect(catalogQueryString(query, { page: 2 })).toBe("?q=abaya&category=abayas&sort=price-asc&page=2");
  });
});
