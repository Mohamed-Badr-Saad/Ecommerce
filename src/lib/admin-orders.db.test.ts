import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cancelUnpaidOrder, markOrderDelivered, markOrderProcessing, markOrderShipped } from "./admin-orders";
import { prisma } from "./prisma";

const suffix = crypto.randomUUID().slice(0, 8);
let productId = "";
let variantId = "";
let fulfillOrderId = "";
let cancelOrderId = "";

describe("admin order operations", () => {
  beforeAll(async () => {
    const category = await prisma.category.findFirstOrThrow();
    const product = await prisma.product.create({ data: { title: "Fulfillment test", slug: `fulfillment-${suffix}`, description: "Temporary fulfillment integration fixture.", categoryId: category.id, price: 100, sku: `FUL-${suffix}`, stockQuantity: 8, status: "ACTIVE", variants: { create: { title: "M", sku: `FUL-${suffix}-M`, size: "M", stockQuantity: 8 } } }, include: { variants: true } });
    productId = product.id; variantId = product.variants[0]!.id;
    const common = { paymentMethod: "COD" as const, status: "CONFIRMED" as const, paymentStatus: "UNPAID" as const, subtotal: 100, shippingCost: 0, total: 100, customerEmail: "ops@talie.test", customerPhone: "01000000000", customerName: "Ops Test", shippingAddress: { street: "Test", city: "Cairo", governorate: "Cairo", country: "EG" } };
    const [fulfill, cancel] = await Promise.all([
      prisma.order.create({ data: { ...common, orderNumber: `FUL-${suffix}`, checkoutToken: crypto.randomUUID(), items: { create: { productId, variantId, title: product.title, sku: product.variants[0]!.sku, quantity: 1, price: 100, total: 100 } }, payments: { create: { provider: "COD", status: "PENDING", amount: 100, idempotencyKey: `fulfill:${suffix}` } } } }),
      prisma.order.create({ data: { ...common, orderNumber: `CAN-${suffix}`, checkoutToken: crypto.randomUUID(), items: { create: { productId, variantId, title: product.title, sku: product.variants[0]!.sku, quantity: 1, price: 100, total: 100 } }, payments: { create: { provider: "COD", status: "PENDING", amount: 100, idempotencyKey: `cancel:${suffix}` } } } }),
    ]);
    fulfillOrderId = fulfill.id; cancelOrderId = cancel.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { id: { in: [fulfillOrderId, cancelOrderId] } } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it("moves COD orders through processing, shipping, and paid delivery", async () => {
    expect((await markOrderProcessing(fulfillOrderId)).status).toBe("PROCESSING");
    const shipped = await markOrderShipped(fulfillOrderId, { trackingNumber: "TRACK-1", trackingUrl: "https://carrier.test/TRACK-1" });
    expect(shipped.status).toBe("SHIPPED");
    const delivered = await markOrderDelivered(fulfillOrderId);
    expect(delivered.status).toBe("DELIVERED");
    expect(delivered.paymentStatus).toBe("PAID");
  });

  it("cancels an unpaid order and restores inventory once", async () => {
    const before = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect((await cancelUnpaidOrder(cancelOrderId)).status).toBe("CANCELLED");
    await cancelUnpaidOrder(cancelOrderId);
    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(after.stockQuantity).toBe(before.stockQuantity + 1);
  });
});
