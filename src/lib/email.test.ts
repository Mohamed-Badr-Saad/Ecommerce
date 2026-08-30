import { describe, expect, it } from "vitest";

import { buildPasswordResetEmail } from "./email";

describe("password reset email", () => {
  it("includes the reset link in HTML and plain text without allowing name markup", () => {
    const resetUrl = "https://shop.example/reset?token=abc&next=account";
    const message = buildPasswordResetEmail({ name: '<img src=x onerror="alert(1)">', resetUrl });

    expect(message.subject).toBe("Reset your Talié password");
    expect(message.text).toContain(resetUrl);
    expect(message.html).toContain("https://shop.example/reset?token=abc&amp;next=account");
    expect(message.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(message.html).not.toContain("<img src=x");
  });
});
