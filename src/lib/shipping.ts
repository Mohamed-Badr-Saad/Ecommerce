import { z } from "zod";

import { DEFAULT_SHIPPING_SETTINGS, EGYPTIAN_GOVERNORATES, type Governorate, type ShippingSettings } from "./commerce";
import { prisma } from "./prisma";

/**
 * Delivery fees per governorate and the free-delivery amount, edited in Admin → Settings.
 * Stored as one JSON row in `store_settings`, so no database migration is needed.
 */

const SETTING_KEY = "shipping";

const fee = z.coerce.number({ error: "Enter a number." }).min(0, "Fees can't be negative.").max(10000, "That fee looks too high.");

const shippingSettingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().min(1, "Enter an amount above 0.").max(1_000_000).nullable(),
  rates: z.object(Object.fromEntries(EGYPTIAN_GOVERNORATES.map((name) => [name, fee])) as Record<Governorate, typeof fee>),
});

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const setting = await prisma.storeSettings.findUnique({ where: { key: SETTING_KEY } });
    if (!setting) return DEFAULT_SHIPPING_SETTINGS;
    // Merge over the defaults so a governorate added later still gets a fee.
    const stored = setting.value as Partial<ShippingSettings> | null;
    const parsed = shippingSettingsSchema.safeParse({
      freeShippingThreshold: stored?.freeShippingThreshold ?? null,
      rates: { ...DEFAULT_SHIPPING_SETTINGS.rates, ...(stored?.rates ?? {}) },
    });
    return parsed.success ? parsed.data : DEFAULT_SHIPPING_SETTINGS;
  } catch (error) {
    console.error("[shipping] Could not load delivery settings", { name: error instanceof Error ? error.name : "UnknownError" });
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

export class ShippingSettingsError extends Error {}

/** Reads the admin form: `freeShippingEnabled`, `freeShippingThreshold`, and one `rate:<Governorate>` field each. */
export function parseShippingForm(formData: FormData): ShippingSettings {
  const enabled = formData.get("freeShippingEnabled") === "on";
  const rawThreshold = String(formData.get("freeShippingThreshold") ?? "").trim();
  if (enabled && !rawThreshold) throw new ShippingSettingsError("Enter the order amount for free delivery, or turn free delivery off.");
  // Empty fee boxes would coerce to 0 (free); require every fee to be filled in.
  const empty = EGYPTIAN_GOVERNORATES.find((name) => !String(formData.get(`rate:${name}`) ?? "").trim());
  if (empty) throw new ShippingSettingsError(`Enter a delivery fee for ${empty} (use 0 for free delivery there).`);
  const parsed = shippingSettingsSchema.safeParse({
    freeShippingThreshold: enabled ? rawThreshold : null,
    rates: Object.fromEntries(EGYPTIAN_GOVERNORATES.map((name) => [name, String(formData.get(`rate:${name}`) ?? "").trim()])),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path[0] === "rates" ? ` (${String(issue.path[1])})` : issue?.path[0] === "freeShippingThreshold" ? " (free delivery amount)" : "";
    throw new ShippingSettingsError(`${issue?.message ?? "Check the delivery fees."}${where}`);
  }
  return parsed.data;
}

export async function saveShippingSettings(settings: ShippingSettings) {
  const value = shippingSettingsSchema.parse(settings);
  await prisma.storeSettings.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value, description: "Delivery fee per governorate and the free-delivery order amount." },
  });
}
