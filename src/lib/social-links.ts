import { toWhatsAppNumber } from "./order-messages";
import { prisma } from "./prisma";
import { readStoreSetting } from "./store-settings";

/**
 * The store's social media accounts, shown as icons in the site footer.
 * Only accounts the admin has filled in are shown. Stored as one JSON row in
 * `store_settings`, so no database migration is needed.
 */

export const SOCIAL_LINKS_SETTING_KEY = "social-links";
const SETTING_KEY = SOCIAL_LINKS_SETTING_KEY;

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", hint: "Profile link or @username", hosts: ["instagram.com"], profileUrl: (name: string) => `https://www.instagram.com/${name}` },
  { key: "tiktok", label: "TikTok", hint: "Profile link or @username", hosts: ["tiktok.com"], profileUrl: (name: string) => `https://www.tiktok.com/@${name}` },
  { key: "facebook", label: "Facebook", hint: "Page link or page name", hosts: ["facebook.com", "fb.com", "fb.me"], profileUrl: (name: string) => `https://www.facebook.com/${name}` },
  { key: "x", label: "X (Twitter)", hint: "Profile link or @username", hosts: ["x.com", "twitter.com"], profileUrl: (name: string) => `https://x.com/${name}` },
  { key: "whatsapp", label: "WhatsApp", hint: "Phone number (e.g. 01012345678) or wa.me link", hosts: ["wa.me", "whatsapp.com"], profileUrl: null },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type SocialLinks = Partial<Record<SocialKey, string>>;

export class SocialLinkError extends Error {}

function hostMatches(hostname: string, hosts: readonly string[]) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Turns what the admin typed into a safe https link for that platform.
 * Returns null for an empty box (account hidden) and throws a friendly error for anything unusable.
 */
export function normalizeSocialLink(key: SocialKey, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const platform = SOCIAL_PLATFORMS.find((item) => item.key === key);
  if (!platform) throw new SocialLinkError("Unknown social account.");

  // A full link (with or without https://).
  const looksLikeLink = /^https?:\/\//i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(value);
  if (looksLikeLink) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    } catch {
      throw new SocialLinkError(`${platform.label}: that link doesn't look right.`);
    }
    if (!hostMatches(url.hostname, platform.hosts)) throw new SocialLinkError(`${platform.label}: please paste a link from ${platform.hosts[0]}.`);
    url.protocol = "https:";
    return url.toString().slice(0, 300);
  }

  if (key === "whatsapp") {
    const number = toWhatsAppNumber(value);
    if (!number) throw new SocialLinkError("WhatsApp: enter a phone number like 01012345678 or +201012345678.");
    return `https://wa.me/${number}`;
  }

  // A username or page name.
  const name = value.replace(/^@/, "");
  if (!/^[A-Za-z0-9._-]{1,60}$/.test(name) || !platform.profileUrl) throw new SocialLinkError(`${platform.label}: enter the profile link or a username without spaces.`);
  return platform.profileUrl(name);
}

/** Reads the admin form (one field per platform key) into cleaned links. */
export function parseSocialLinksForm(formData: FormData): SocialLinks {
  const links: SocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const link = normalizeSocialLink(platform.key, String(formData.get(platform.key) ?? ""));
    if (link) links[platform.key] = link;
  }
  return links;
}

export async function getSocialLinks(): Promise<SocialLinks> {
  try {
    const setting = await readStoreSetting(SETTING_KEY);
    const stored = (setting?.value ?? {}) as Record<string, unknown>;
    const links: SocialLinks = {};
    for (const platform of SOCIAL_PLATFORMS) {
      const value = stored[platform.key];
      // Re-check on the way out so only safe https links ever reach the page.
      if (typeof value === "string" && value.startsWith("https://")) links[platform.key] = value;
    }
    return links;
  } catch (error) {
    // The footer should never take the page down.
    console.error("[social] Could not load social links", { name: error instanceof Error ? error.name : "UnknownError" });
    return {};
  }
}

export async function saveSocialLinks(links: SocialLinks) {
  await prisma.storeSettings.upsert({
    where: { key: SETTING_KEY },
    update: { value: links },
    create: { key: SETTING_KEY, value: links, description: "Social media accounts shown in the site footer." },
  });
}
