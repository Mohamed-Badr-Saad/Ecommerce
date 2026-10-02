import { describe, expect, it } from "vitest";

import { normalizeSocialLink, SocialLinkError } from "./social-links";

describe("social media links", () => {
  it("accepts a username or a full link and always stores https", () => {
    expect(normalizeSocialLink("instagram", "@talie.store")).toBe("https://www.instagram.com/talie.store");
    expect(normalizeSocialLink("instagram", "instagram.com/talie.store/")).toBe("https://instagram.com/talie.store/");
    expect(normalizeSocialLink("tiktok", "talie")).toBe("https://www.tiktok.com/@talie");
    expect(normalizeSocialLink("x", "http://twitter.com/talie")).toBe("https://twitter.com/talie");
    expect(normalizeSocialLink("facebook", "https://www.facebook.com/talie")).toBe("https://www.facebook.com/talie");
  });

  it("builds a WhatsApp chat link from a phone number", () => {
    expect(normalizeSocialLink("whatsapp", "01012345678")).toBe("https://wa.me/201012345678");
    expect(normalizeSocialLink("whatsapp", "https://wa.me/201012345678")).toBe("https://wa.me/201012345678");
  });

  it("treats an empty box as hidden and rejects links to other sites", () => {
    expect(normalizeSocialLink("tiktok", "  ")).toBeNull();
    expect(() => normalizeSocialLink("instagram", "https://evil.example/talie")).toThrow(SocialLinkError);
    expect(() => normalizeSocialLink("facebook", "javascript:alert(1)")).toThrow(SocialLinkError);
    expect(() => normalizeSocialLink("whatsapp", "call me")).toThrow(SocialLinkError);
  });
});
