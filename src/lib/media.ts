import { z } from "zod";

const allowedRemoteImageHosts = new Set([
  "images.unsplash.com",
  "i.pinimg.com",
  "cdn.shopify.com",
  "utfs.io",
  "sfacevoxgadytkbidtbl.supabase.co",
]);

const configuredSupabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();
const configuredSupabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "talie-catalog";

export function isAllowedStorefrontImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    const allowedHost = allowedRemoteImageHosts.has(url.hostname) || url.hostname === configuredSupabaseHost || url.hostname.endsWith(".ufs.sh");
    const safeSupabasePath = url.hostname !== configuredSupabaseHost || url.pathname.startsWith(`/storage/v1/object/public/${configuredSupabaseBucket}/`);
    return url.protocol === "https:" && allowedHost && safeSupabasePath;
  } catch {
    return false;
  }
}

export const storefrontImageUrlSchema = z.string().trim().refine(isAllowedStorefrontImageUrl, "Use a local image or an approved Supabase, Unsplash, Pinterest, Shopify, or legacy UploadThing URL.");
