import { describe, expect, it } from "vitest";

import { catalogQueryString, countActiveFilters, parseCatalogQuery } from "./catalog";

describe("catalog query parsing", () => {
  it("normalizes invalid paging and sorting values", () => {
    expect(parseCatalogQuery({ page: "-4", sort: "random", availability: "maybe" })).toEqual({
      q: undefined,
      collection: [],
      category: [],
      color: [],
      size: [],
      availability: [],
      sort: "newest",
      page: 1,
    });
  });

  it("preserves active filters while changing a page", () => {
    const query = parseCatalogQuery({ q: "abaya", collection: "debut-edit", category: "abayas", sort: "price-asc" });
    expect(catalogQueryString(query, { page: 2 })).toBe("?q=abaya&collection=debut-edit&category=abayas&sort=price-asc&page=2");
  });

  it("accepts several values for each filter", () => {
    const query = parseCatalogQuery({ category: ["abayas", "dresses"], size: ["S", "M", "S", " "], color: "Burgundy", availability: ["in-stock", "nope"] });
    expect(query.category).toEqual(["abayas", "dresses"]);
    expect(query.size).toEqual(["S", "M"]);
    expect(query.color).toEqual(["Burgundy"]);
    expect(query.availability).toEqual(["in-stock"]);
    expect(countActiveFilters(query)).toBe(6);
    expect(catalogQueryString(query, {})).toBe("?category=abayas&category=dresses&size=S&size=M&color=Burgundy&availability=in-stock");
  });

  it("removes one value without touching the others", () => {
    const query = parseCatalogQuery({ size: ["S", "M"], page: "3" });
    expect(catalogQueryString(query, { size: query.size.filter((size) => size !== "S"), page: 1 })).toBe("?size=M");
  });
});
