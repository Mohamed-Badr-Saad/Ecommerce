import { randomUUID } from "node:crypto";

import { z } from "zod";

import { DEFAULT_SHIPPING_SETTINGS } from "./commerce";
import { prisma } from "./prisma";

/**
 * Messages for the strip at the very top of every page (flash deals, delivery offers…).
 * Stored as one JSON row in `store_settings`, so no database migration is needed.
 */

const SETTING_KEY = "announcement-bar";

const linkSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value) || null,
  z.union([
    z.string().max(300).regex(/^\/(?!\/)[^\s\\]*$/, "Links must start with / (for example /shop) or https://."),
    z.url({ protocol: /^https$/ }).max(300),
  ]).nullable(),
);

export const announcementInputSchema = z.object({
  text: z.string().trim().min(3, "Write a short message.").max(120, "Keep the message under 120 characters."),
  link: linkSchema,
  isActive: z.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

const announcementSchema = announcementInputSchema.extend({ id: z.string().min(1) });
const storedSchema = z.object({ items: z.array(announcementSchema).max(20) });

export type Announcement = z.output<typeof announcementSchema>;

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: "default-delivery", text: `Free delivery on orders over EGP ${(DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold ?? 0).toLocaleString("en-EG")}`, link: null, isActive: true, position: 0 },
];

function sortAnnouncements(items: Announcement[]) {
  return [...items].sort((a, b) => a.position - b.position);
}

/** All announcements for the admin. Before the admin saves anything, the free-delivery message is shown. */
export async function getAnnouncements(): Promise<{ items: Announcement[]; configured: boolean }> {
  const setting = await prisma.storeSettings.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) return { items: DEFAULT_ANNOUNCEMENTS, configured: false };
  const parsed = storedSchema.safeParse(setting.value);
  return { items: parsed.success ? sortAnnouncements(parsed.data.items) : [], configured: true };
}

export async function getActiveAnnouncements() {
  try {
    const { items } = await getAnnouncements();
    return items.filter((item) => item.isActive).map(({ id, text, link }) => ({ id, text, link }));
  } catch {
    // The announcement strip should never take the whole page down.
    return [];
  }
}

async function saveAnnouncements(items: Announcement[]) {
  const value = { items: sortAnnouncements(items) };
  await prisma.storeSettings.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value, description: "Messages shown in the announcement strip at the top of every page." },
  });
}

export async function addAnnouncement(input: z.input<typeof announcementInputSchema>) {
  const data = announcementInputSchema.parse(input);
  const { items } = await getAnnouncements();
  if (items.length >= 20) throw new Error("You can keep up to 20 messages. Delete an old one first.");
  const created = { ...data, id: randomUUID() };
  await saveAnnouncements([...items, created]);
  return created;
}

export async function updateAnnouncement(id: string, input: z.input<typeof announcementInputSchema>) {
  const data = announcementInputSchema.parse(input);
  const { items } = await getAnnouncements();
  if (!items.some((item) => item.id === id)) throw new Error("This message no longer exists.");
  await saveAnnouncements(items.map((item) => (item.id === id ? { ...data, id } : item)));
}

export async function toggleAnnouncement(id: string) {
  const { items } = await getAnnouncements();
  const current = items.find((item) => item.id === id);
  if (!current) throw new Error("This message no longer exists.");
  await saveAnnouncements(items.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item)));
  return !current.isActive;
}

export async function deleteAnnouncement(id: string) {
  const { items } = await getAnnouncements();
  await saveAnnouncements(items.filter((item) => item.id !== id));
}
