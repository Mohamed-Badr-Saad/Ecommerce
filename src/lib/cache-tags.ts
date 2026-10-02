import { unstable_cache, updateTag } from "next/cache";

/**
 * Names for the shared caches of storefront data. Cached reads carry one of these tags;
 * calling the matching refresh function from a Server Action after a change makes the
 * very next page view load fresh data.
 */
export const CATALOG_CACHE_TAG = "catalog"; // products shown on the homepage, collections, categories, filters
export const HOMEPAGE_CONTENT_CACHE_TAG = "homepage-content"; // banners and customer screenshots

/** Safety net: cached data is also refreshed at least this often (seconds). */
export const STOREFRONT_CACHE_SECONDS = 300;

/**
 * Wraps a database read in a shared cache with the given tag. The cache is created on first
 * use (not when the file loads), so plain unit tests can import these modules safely.
 */
export function storefrontCache<Args extends unknown[], Result>(read: (...args: Args) => Promise<Result>, key: string, tag: string) {
  let cached: ((...args: Args) => Promise<Result>) | undefined;
  return (...args: Args): Promise<Result> => {
    cached ??= unstable_cache(read, [key], { tags: [tag], revalidate: STOREFRONT_CACHE_SECONDS });
    return cached(...args);
  };
}

export function refreshCatalogCache() {
  updateTag(CATALOG_CACHE_TAG);
}

export function refreshHomepageContentCache() {
  updateTag(HOMEPAGE_CONTENT_CACHE_TAG);
}
