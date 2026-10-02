import { describe, expect, it } from "vitest";

import { feedbackMessageSchema } from "./feedback-messages";

describe("homepage feedback form", () => {
  it("accepts a rating and message, with name and email optional", () => {
    const parsed = feedbackMessageSchema.parse({ rating: "5", name: "  ", email: "", message: "  Lovely fabric and fast delivery!  " });
    expect(parsed).toEqual({ rating: 5, name: undefined, email: undefined, message: "Lovely fabric and fast delivery!" });
  });

  it("normalises the email address", () => {
    expect(feedbackMessageSchema.parse({ rating: 4, email: " Mariam@Example.COM ", message: "Great fit" }).email).toBe("mariam@example.com");
  });

  it("rejects missing stars, very short messages and bad emails", () => {
    expect(feedbackMessageSchema.safeParse({ message: "Nice dress" }).success).toBe(false);
    expect(feedbackMessageSchema.safeParse({ rating: 6, message: "Nice dress" }).success).toBe(false);
    expect(feedbackMessageSchema.safeParse({ rating: 3, message: "ok" }).success).toBe(false);
    expect(feedbackMessageSchema.safeParse({ rating: 3, email: "not-an-email", message: "Nice dress" }).success).toBe(false);
  });
});
