import { z } from "zod";

export const CART_MAX_QUANTITY = 10;

export const EGYPTIAN_GOVERNORATES = [
  "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia",
  "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh", "Luxor",
  "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia",
  "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez",
] as const;

export type Governorate = (typeof EGYPTIAN_GOVERNORATES)[number];

/** Delivery pricing, set by the admin in Admin → Settings → Delivery. */
export type ShippingSettings = {
  /** Orders at or above this amount (after discounts) ship free; null turns free delivery off. */
  freeShippingThreshold: number | null;
  /** Delivery fee in EGP for each governorate. */
  rates: Record<Governorate, number>;
};

const localRate = new Set<string>(["Cairo", "Giza"]);
const standardRate = new Set<string>(["Alexandria", "Beheira", "Dakahlia", "Damietta", "Gharbia", "Ismailia", "Kafr El Sheikh", "Monufia", "Port Said", "Qalyubia", "Sharqia", "Suez"]);

/** Used until the admin saves their own delivery settings. */
export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  freeShippingThreshold: 2500,
  rates: Object.fromEntries(EGYPTIAN_GOVERNORATES.map((name) => [name, localRate.has(name) ? 85 : standardRate.has(name) ? 110 : 140])) as Record<Governorate, number>,
};

export function calculateShipping(subtotal: number, governorate: string, settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS) {
  if (settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold) return 0;
  const rate = settings.rates[governorate as Governorate];
  return typeof rate === "number" ? rate : Math.max(...Object.values(settings.rates));
}

export function calculateMerchandiseTotals(lines: { price: number; compareAtPrice?: number | null; quantity: number }[]) {
  return lines.reduce((totals, line) => {
    const originalPrice = line.compareAtPrice && line.compareAtPrice > line.price ? line.compareAtPrice : line.price;
    totals.originalSubtotal += originalPrice * line.quantity;
    totals.subtotal += line.price * line.quantity;
    totals.discount += (originalPrice - line.price) * line.quantity;
    return totals;
  }, { originalSubtotal: 0, subtotal: 0, discount: 0 });
}

export const cartQuantitySchema = z.coerce.number().int().min(1).max(CART_MAX_QUANTITY);

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().regex(/^(?:\+20|0)?1[0125]\d{8}$/, "Enter a valid Egyptian mobile number."),
  street: z.string().trim().min(5).max(160),
  apartment: z.string().trim().max(80).optional(),
  city: z.string().trim().min(2).max(80),
  governorate: z.enum(EGYPTIAN_GOVERNORATES),
  postalCode: z.string().trim().max(12).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
