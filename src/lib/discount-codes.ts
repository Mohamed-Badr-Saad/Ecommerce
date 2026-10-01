import type { Prisma } from "../generated/prisma/client";
import { discountCodeEntrySchema, evaluateDiscount, type DiscountEvaluation, type DiscountRule } from "./discounts";
import { prisma } from "./prisma";

type Db = Prisma.TransactionClient | typeof prisma;

type Money = number | { toString(): string };

type DiscountRecord = {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: Money;
  minSubtotal: Money | null;
  maxDiscount: Money | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export class DiscountCodeError extends Error {}

export function toDiscountRule(record: DiscountRecord): DiscountRule {
  return {
    code: record.code,
    type: record.type,
    value: Number(record.value),
    minSubtotal: record.minSubtotal === null ? null : Number(record.minSubtotal),
    maxDiscount: record.maxDiscount === null ? null : Number(record.maxDiscount),
    usageLimit: record.usageLimit,
    perCustomerLimit: record.perCustomerLimit,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    isActive: record.isActive,
  };
}

/** Orders that still hold a code: everything except cancelled orders. */
export async function countDiscountUsage(db: Db, discountCodeId: string, userId?: string | null) {
  const where = { discountCodeId, status: { not: "CANCELLED" as const } };
  const [totalUses, customerUses] = await Promise.all([
    db.order.count({ where }),
    userId ? db.order.count({ where: { ...where, userId } }) : Promise.resolve(0),
  ]);
  return { totalUses, customerUses };
}

export async function evaluateDiscountRecord(db: Db, record: DiscountRecord & { id: string }, subtotal: number, userId?: string | null, now = new Date()): Promise<DiscountEvaluation> {
  const usage = await countDiscountUsage(db, record.id, userId);
  return evaluateDiscount(toDiscountRule(record), subtotal, usage, now, Boolean(userId));
}

/** Validates a customer-entered code against the given bag and attaches it to the cart. */
export async function attachDiscountCode(cartId: string, rawCode: unknown, subtotal: number, userId?: string | null) {
  const parsed = discountCodeEntrySchema.safeParse(rawCode);
  if (!parsed.success) throw new DiscountCodeError("Enter a valid discount code.");
  const record = await prisma.discountCode.findUnique({ where: { code: parsed.data } });
  if (!record) throw new DiscountCodeError("We couldn't find that code.");
  const result = await evaluateDiscountRecord(prisma, record, subtotal, userId);
  if (!result.ok) throw new DiscountCodeError(result.reason);
  await prisma.cart.update({ where: { id: cartId }, data: { discountCodeId: record.id } });
  return result;
}

export async function detachDiscountCode(cartId: string) {
  await prisma.cart.update({ where: { id: cartId }, data: { discountCodeId: null } });
}

export async function getAdminDiscountCodes() {
  const codes = await prisma.discountCode.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], include: { _count: { select: { orders: true } } } });
  const usage = await prisma.order.groupBy({
    by: ["discountCodeId"],
    where: { discountCodeId: { in: codes.map((code) => code.id) }, status: { not: "CANCELLED" } },
    _count: { _all: true },
    _sum: { couponDiscount: true },
  });
  const byId = new Map(usage.map((row) => [row.discountCodeId, row]));
  return codes.map((code) => ({
    ...code,
    rule: toDiscountRule(code),
    uses: byId.get(code.id)?._count._all ?? 0,
    totalDiscounted: Number(byId.get(code.id)?._sum.couponDiscount ?? 0),
  }));
}
