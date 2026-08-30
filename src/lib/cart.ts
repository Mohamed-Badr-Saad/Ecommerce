import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import { CART_MAX_QUANTITY, calculateMerchandiseTotals, cartQuantitySchema } from "./commerce";
import { prisma } from "./prisma";
import { releaseExpiredPaymentReservations } from "./reservations";
import { getCurrentSession } from "./session";

const CART_COOKIE = "talie_cart";
const GUEST_CART_DAYS = 30;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: { include: { images: { orderBy: [{ isPrimary: "desc" as const }, { displayOrder: "asc" as const }], take: 1 } } },
      variant: true,
    },
  },
};

async function identity() {
  const [session, cookieStore] = await Promise.all([getCurrentSession(), cookies()]);
  return { userId: session?.user.id, token: cookieStore.get(CART_COOKIE)?.value, cookieStore };
}

async function findCart() {
  const { userId, token } = await identity();
  if (userId) return prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  if (token) return prisma.cart.findUnique({ where: { sessionToken: token }, include: cartInclude });
  return null;
}

export async function getCart() {
  await releaseExpiredPaymentReservations();
  const cart = await findCart();
  const items = (cart?.items ?? []).map((item) => {
    const price = Number(item.variant?.price ?? item.product.price);
    const compareAtPrice = item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null;
    const availableStock = item.variant?.stockQuantity ?? item.product.stockQuantity;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      slug: item.product.slug,
      title: item.product.title,
      variantTitle: item.variant?.title ?? null,
      sku: item.variant?.sku ?? item.product.sku,
      image: item.variant?.image ?? item.product.images[0]?.url ?? "/products/dress-mauve.svg",
      quantity: item.quantity,
      price,
      compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
      lineTotal: price * item.quantity,
      availableStock,
      available: item.product.status === "ACTIVE" && availableStock >= item.quantity,
    };
  });
  const totals = calculateMerchandiseTotals(items);
  return { id: cart?.id, items, ...totals, count: items.reduce((total, item) => total + item.quantity, 0) };
}

async function mutableCartId() {
  const { userId, token, cookieStore } = await identity();
  if (userId) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: { expiresAt: null },
      create: { userId },
    });

    if (token) {
      const guest = await prisma.cart.findUnique({ where: { sessionToken: token }, include: { items: true } });
      if (guest && guest.id !== cart.id) {
        await prisma.$transaction(async (tx) => {
          for (const item of guest.items) {
            const existing = await tx.cartItem.findUnique({ where: { cartId_lineKey: { cartId: cart.id, lineKey: item.lineKey } } });
            await tx.cartItem.upsert({
              where: { cartId_lineKey: { cartId: cart.id, lineKey: item.lineKey } },
              update: { quantity: Math.min(CART_MAX_QUANTITY, (existing?.quantity ?? 0) + item.quantity) },
              create: { cartId: cart.id, productId: item.productId, variantId: item.variantId, lineKey: item.lineKey, quantity: item.quantity },
            });
          }
          await tx.cart.delete({ where: { id: guest.id } });
        });
      }
      cookieStore.delete(CART_COOKIE);
    }
    return cart.id;
  }

  const sessionToken = token ?? randomUUID();
  if (!token) cookieStore.set(CART_COOKIE, sessionToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: GUEST_CART_DAYS * 86400, path: "/" });
  const cart = await prisma.cart.upsert({
    where: { sessionToken },
    update: { expiresAt: new Date(Date.now() + GUEST_CART_DAYS * 86400000) },
    create: { sessionToken, expiresAt: new Date(Date.now() + GUEST_CART_DAYS * 86400000) },
  });
  return cart.id;
}

export async function addCartItem(productId: string, variantId: string | null, rawQuantity: unknown) {
  await releaseExpiredPaymentReservations();
  const quantity = cartQuantitySchema.parse(rawQuantity);
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, include: { variants: true } });
  if (!product) throw new Error("This product is no longer available.");
  const variant = variantId ? product.variants.find((item) => item.id === variantId) : null;
  if (product.variants.length && !variant) throw new Error("Choose an available product option.");
  const stock = variant?.stockQuantity ?? product.stockQuantity;
  if (stock < quantity) throw new Error("The requested quantity is not available.");

  const cartId = await mutableCartId();
  const lineKey = `${productId}:${variantId ?? "base"}`;
  const existing = await prisma.cartItem.findUnique({ where: { cartId_lineKey: { cartId, lineKey } } });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > stock || nextQuantity > CART_MAX_QUANTITY) throw new Error(`You can add up to ${Math.min(stock, CART_MAX_QUANTITY)} of this option.`);
  await prisma.cartItem.upsert({
    where: { cartId_lineKey: { cartId, lineKey } },
    update: { quantity: nextQuantity },
    create: { cartId, productId, variantId, lineKey, quantity },
  });
}

export async function updateCartItem(itemId: string, rawQuantity: unknown) {
  const quantity = cartQuantitySchema.parse(rawQuantity);
  const cartId = await mutableCartId();
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId }, include: { product: true, variant: true } });
  if (!item) throw new Error("Cart item not found.");
  const stock = item.variant?.stockQuantity ?? item.product.stockQuantity;
  if (quantity > stock) throw new Error(`Only ${stock} remain available.`);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
}

export async function removeCartItem(itemId: string) {
  const cartId = await mutableCartId();
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
}

export async function getMutableCartId() {
  return mutableCartId();
}
