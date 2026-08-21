import { z } from "zod";

import { prisma } from "./prisma";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(24).optional().transform((value) => value || null),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional().transform((value) => value || null),
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  street: z.string().trim().min(5).max(160),
  apartment: z.string().trim().max(60).optional().transform((value) => value || null),
  city: z.string().trim().min(2).max(80),
  governorate: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).optional().transform((value) => value || null),
  phone: z.string().trim().min(7).max(24),
  isDefault: z.coerce.boolean().default(false),
});

export async function updateProfileForUser(userId: string, input: unknown) {
  const data = profileSchema.parse(input);
  return prisma.user.update({ where: { id: userId }, data });
}

export async function createAddressForUser(userId: string, input: unknown) {
  const data = addressSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } });
    const isDefault = data.isDefault || count === 0;
    if (isDefault) await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    return tx.address.create({ data: { ...data, isDefault, userId } });
  });
}

export async function deleteAddressForUser(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const address = await tx.address.findFirst({ where: { id: addressId, userId } });
    if (!address) return false;
    await tx.address.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return true;
  });
}

export async function setDefaultAddressForUser(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const address = await tx.address.findFirst({ where: { id: addressId, userId } });
    if (!address) return false;
    await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    await tx.address.update({ where: { id: address.id }, data: { isDefault: true } });
    return true;
  });
}

export async function toggleWishlistForUser(userId: string, productSlug: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { slug: productSlug, status: "ACTIVE" }, select: { id: true } });
    if (!product) return { found: false, added: false };
    const wishlist = await tx.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });
    const item = await tx.wishlistItem.findUnique({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } } });
    if (item) {
      await tx.wishlistItem.delete({ where: { id: item.id } });
      return { found: true, added: false };
    }
    await tx.wishlistItem.create({ data: { wishlistId: wishlist.id, productId: product.id } });
    return { found: true, added: true };
  });
}
