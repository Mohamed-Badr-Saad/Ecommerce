import { describe, expect, it } from "vitest";

import { reviewerDisplayName, reviewInputSchema } from "./product-reviews";

describe("product reviews", () => {
  it("shows only the first name and last initial publicly", () => {
    expect(reviewerDisplayName("Mariam Ahmed Hassan")).toBe("Mariam H.");
    expect(reviewerDisplayName("Salma")).toBe("Salma");
    expect(reviewerDisplayName("  ")).toBe("Talié customer");
    expect(reviewerDisplayName(null)).toBe("Talié customer");
  });

  it("accepts a rating with a title and a real review", () => {
    expect(reviewInputSchema.parse({ rating: "5", title: "  True to size ", content: "Beautiful drape and soft fabric." })).toEqual({ rating: 5, title: "True to size", content: "Beautiful drape and soft fabric." });
  });

  it("rejects missing stars, tiny titles and one-word reviews", () => {
    expect(reviewInputSchema.safeParse({ title: "Lovely", content: "Beautiful drape and fabric." }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 0, title: "Lovely", content: "Beautiful drape and fabric." }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 4, title: "ok", content: "Beautiful drape and fabric." }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 4, title: "Lovely", content: "Nice" }).success).toBe(false);
  });
});
