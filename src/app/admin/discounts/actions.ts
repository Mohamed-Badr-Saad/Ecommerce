"use server";

import { revalidatePath } from "next/cache";

import { logAdminActivity } from "@/lib/admin";
import { discountCodeInputSchema } from "@/lib/discounts";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

function parseDiscountForm(formData: FormData) {
  const parsed = discountCodeInputSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  return parsed.data;
}

function refresh() {
  revalidatePath("/admin/discounts");
  revalidatePath("/cart");
}

export async function createDiscountCodeAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = parseDiscountForm(formData);
  if (await prisma.discountCode.findUnique({ where: { code: data.code }, select: { id: true } })) throw new Error(`The code ${data.code} already exists.`);
  const discount = await prisma.discountCode.create({ data });
  await logAdminActivity(session.user.id, { action: "created discount code", entityType: "discount_code", entityId: discount.id, details: { code: discount.code } });
  refresh();
}

export async function updateDiscountCodeAction(discountId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = parseDiscountForm(formData);
  const current = await prisma.discountCode.findUniqueOrThrow({ where: { id: discountId }, include: { _count: { select: { orders: true } } } });
  // Past orders store the code text, but renaming a used code would confuse reporting.
  if (current.code !== data.code && current._count.orders > 0) throw new Error("A code that has been used on orders cannot be renamed. Create a new code instead.");
  if (current.code !== data.code && await prisma.discountCode.findUnique({ where: { code: data.code }, select: { id: true } })) throw new Error(`The code ${data.code} already exists.`);
  const discount = await prisma.discountCode.update({ where: { id: discountId }, data });
  await logAdminActivity(session.user.id, { action: "updated discount code", entityType: "discount_code", entityId: discount.id, details: { code: discount.code } });
  refresh();
}

export async function toggleDiscountCodeAction(discountId: string) {
  const session = await requireAdminSession();
  const current = await prisma.discountCode.findUniqueOrThrow({ where: { id: discountId } });
  const discount = await prisma.discountCode.update({ where: { id: discountId }, data: { isActive: !current.isActive } });
  await logAdminActivity(session.user.id, { action: discount.isActive ? "activated discount code" : "deactivated discount code", entityType: "discount_code", entityId: discount.id, details: { code: discount.code } });
  refresh();
}

export async function deleteDiscountCodeAction(discountId: string) {
  const session = await requireAdminSession();
  const current = await prisma.discountCode.findUniqueOrThrow({ where: { id: discountId }, include: { _count: { select: { orders: true } } } });
  if (current._count.orders > 0) throw new Error("This code has been used on orders. Deactivate it instead so order history stays intact.");
  await prisma.discountCode.delete({ where: { id: discountId } });
  await logAdminActivity(session.user.id, { action: "deleted discount code", entityType: "discount_code", entityId: current.id, details: { code: current.code } });
  refresh();
}
