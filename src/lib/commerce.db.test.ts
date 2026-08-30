import { createHmac } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createCodOrderFromCart, createPaymobOrderFromCart, recordPaymobIntention } from "./orders";
import { processPaymobWebhook } from "./paymob-webhook";
import { prisma } from "./prisma";
import { PAYMENT_RESERVATION_MS, releaseExpiredPaymentReservations } from "./reservations";

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

  it("releases an unpaid Paymob reservation after one hour", async () => {
    const before = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    const cart = await cartWithQuantity(1);
    const reservedAt = new Date("2026-08-21T20:00:00.000Z");
    const result = await createPaymobOrderFromCart(cart.id, checkout, undefined, reservedAt);
    const pending = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(pending.status).toBe("PENDING");
    expect(pending.paymentStatus).toBe("PENDING");
    expect(pending.reservationExpiresAt?.getTime()).toBe(reservedAt.getTime() + PAYMENT_RESERVATION_MS);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity).toBe(before.stockQuantity - 1);

    expect(await releaseExpiredPaymentReservations(new Date(reservedAt.getTime() + PAYMENT_RESERVATION_MS + 1))).toBe(1);
    const released = await prisma.order.findUniqueOrThrow({ where: { id: pending.id }, include: { payments: true } });
    expect(released.status).toBe("CANCELLED");
    expect(released.paymentStatus).toBe("FAILED");
    expect(released.inventoryReleasedAt).not.toBeNull();
    expect(released.payments[0].status).toBe("FAILED");
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity).toBe(before.stockQuantity);
  });

  it("keeps stock reserved after a failed Paymob attempt and confirms a later successful retry", async () => {
    const stockBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    const cart = await cartWithQuantity(1);
    const result = await createPaymobOrderFromCart(cart.id, checkout);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    const providerOrderId = 88001122;
    const failedTransactionId = 99001121;
    const successfulTransactionId = 99001122;
    await recordPaymobIntention(order.id, String(providerOrderId), { status: "intended" });
    const object = {
      amount_cents: Math.round(Number(order.total) * 100), created_at: "2026-08-22T12:00:00.000000", currency: "EGP",
      error_occured: true, has_parent_transaction: false, id: failedTransactionId,
      integration_id: Number(process.env.PAYMOB_INTEGRATION_ID), is_3d_secure: true, is_auth: false, is_capture: false,
      is_refunded: false, is_standalone_payment: true, is_voided: false,
      order: { id: providerOrderId, merchant_order_id: order.orderNumber }, owner: 1, pending: false,
      source_data: { pan: "1111", sub_type: "MasterCard", type: "card" }, success: false,
    };
    const sign = (callback: typeof object) => createHmac("sha512", process.env.PAYMOB_HMAC_SECRET!).update([
      callback.amount_cents, callback.created_at, callback.currency, callback.error_occured, callback.has_parent_transaction,
      callback.id, callback.integration_id, callback.is_3d_secure, callback.is_auth, callback.is_capture, callback.is_refunded,
      callback.is_standalone_payment, callback.is_voided, callback.order.id, callback.owner, callback.pending,
      callback.source_data.pan, callback.source_data.sub_type, callback.source_data.type, callback.success,
    ].map(String).join("")).digest("hex");

    expect((await processPaymobWebhook({ obj: object }, sign(object))).outcome).toBe("attempt_failed");
    const afterFailure = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: { include: { attempts: true } } } });
    expect(afterFailure.status).toBe("PENDING");
    expect(afterFailure.paymentStatus).toBe("PENDING");
    expect(afterFailure.inventoryReleasedAt).toBeNull();
    expect(afterFailure.payments[0].attempts[0].status).toBe("FAILED");
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity).toBe(stockBefore.stockQuantity - 1);

    const successful = { ...object, id: successfulTransactionId, error_occured: false, success: true };

    expect((await processPaymobWebhook({ obj: successful }, sign(successful))).outcome).toBe("paid");
    expect((await processPaymobWebhook({ obj: successful }, sign(successful))).outcome).toBe("paid");
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: { include: { attempts: true } } } });
    expect(paid.status).toBe("CONFIRMED");
    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.payments[0].providerTransactionId).toBe(String(successfulTransactionId));
    expect(paid.payments[0].attempts).toHaveLength(2);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity).toBe(stockBefore.stockQuantity - 1);
  });
});
