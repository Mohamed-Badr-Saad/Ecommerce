import { z } from "zod";

export const FREE_SHIPPING_THRESHOLD = 2500;
export const CART_MAX_QUANTITY = 10;

export const EGYPTIAN_GOVERNORATES = [
  "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Cairo", "Dakahlia",
  "Damietta", "Faiyum", "Gharbia", "Giza", "Ismailia", "Kafr El Sheikh", "Luxor",
  "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai", "Port Said", "Qalyubia",
  "Qena", "Red Sea", "Sharqia", "Sohag", "South Sinai", "Suez",
] as const;

const localRate = new Set(["Cairo", "Giza"]);
const standardRate = new Set(["Alexandria", "Beheira", "Dakahlia", "Damietta", "Gharbia", "Ismailia", "Kafr El Sheikh", "Monufia", "Port Said", "Qalyubia", "Sharqia", "Suez"]);

export function calculateShipping(subtotal: number, governorate: string) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (localRate.has(governorate)) return 85;
  if (standardRate.has(governorate)) return 110;
  return 140;
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
