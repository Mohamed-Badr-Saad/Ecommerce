import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createCodOrderFromCart } from "./orders";
import { prisma } from "./prisma";

const checkout = { firstName: "Mariam", lastName: "Hassan", email: "checkout@talie.test", phone: "01012345678", street: "12 Nile Street", city: "Dokki", governorate: "Giza" as const };
let productId = "";
let variantId = "";
let productStock = 0;
let variantStock = 0;
const cartIds: string[] = [];

describe("transactional COD checkout", () => {
  beforeAll(async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: "safa-draped-abaya" }, include: { variants: { orderBy: { displayOrder: "asc" }, take: 1 } } });
    productId = product.id;
    variantId = product.variants[0].id;
    productStock = product.stockQuantity;
    variantStock = product.variants[0].stockQuantity;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { customerEmail: checkout.email } });
    await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: productStock } });
    await prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: variantStock } });
    await prisma.$disconnect();
  });

  async function cartWithQuantity(quantity: number) {
    const cart = await prisma.cart.create({ data: { sessionToken: `commerce-test-${crypto.randomUUID()}`, items: { create: { productId, variantId, lineKey: `${productId}:${variantId}`, quantity } } } });
    cartIds.push(cart.id);
    return cart;
  }

  it("snapshots current prices, creates a pending COD payment, clears the cart, and decrements stock", async () => {
    const cart = await cartWithQuantity(1);
    const result = await createCodOrderFromCart(cart.id, checkout);
    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber }, include: { items: true, payments: true } });
    expect(order.paymentMethod).toBe("COD");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.shippingCost.toFixed(2)).toBe("85.00");
    expect(order.items).toHaveLength(1);
    expect(order.payments[0].status).toBe("PENDING");
    expect(await prisma.cartItem.count({ where: { cartId: cart.id } })).toBe(0);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity).toBe(variantStock - 1);
  });

  it("rolls back the order when requested stock is unavailable", async () => {
    const current = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    const cart = await cartWithQuantity(current.stockQuantity + 1);
    await expect(createCodOrderFromCart(cart.id, checkout)).rejects.toThrow(/available|sold out/);
    expect(await prisma.order.count({ where: { customerEmail: checkout.email } })).toBe(1);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity).toBe(current.stockQuantity);
  });
});
