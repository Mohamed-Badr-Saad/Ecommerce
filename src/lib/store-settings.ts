import { unstable_cache, updateTag } from "next/cache";

import { prisma } from "./prisma";

/**
 * Store settings (announcements, social links, delivery fees…) are read on almost every page
 * but change only when the admin saves them. Each one is cached across requests and refreshed
 * the moment the admin saves (see refreshStoreSetting), with an hourly safety refresh.
 */

const tagFor = (key: string) => `store-setting:${key}`;

const readers = new Map<string, () => Promise<{ value: unknown } | null>>();

/** The saved value for `key` (null when the admin has never saved it). Errors are not cached. */
export async function readStoreSetting(key: string) {
  let reader = readers.get(key);
  if (!reader) {
    reader = unstable_cache(
      async () => {
        const row = await prisma.storeSettings.findUnique({ where: { key }, select: { value: true } });
        return row ? { value: row.value as unknown } : null;
      },
      ["store-setting", key],
      { tags: [tagFor(key)], revalidate: 3600 },
    );
    readers.set(key, reader);
  }
  return reader();
}

/** Call from a Server Action right after saving, so the next page view shows the change. */
export function refreshStoreSetting(key: string) {
  updateTag(tagFor(key));
}
