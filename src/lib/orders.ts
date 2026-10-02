import { randomUUID } from "node:crypto";

import { calculateMerchandiseTotals, calculateShipping, type CheckoutInput } from "./commerce";
import { getMutableCartId } from "./cart";
import { evaluateDiscountRecord } from "./discount-codes";
import { prisma } from "./prisma";
import { getShippingSettings } from "./shipping";
import { getCurrentSession } from "./session";

export class CheckoutError extends Error {}

export async function createCodOrder(input: CheckoutInput) {
  const [cartId, session] = await Promise.all([getMutableCartId(), getCurrentSession()]);
  if (!session || session.user.banned) throw new CheckoutError("Sign in to place your order.");
  return createCodOrderFromCart(cartId, input, session.user.id);
}

/** Turns the bag into a cash-on-delivery order: stock is taken and the bag is emptied in one transaction. */
export async function createCodOrderFromCart(cartId: string, input: CheckoutInput, userId?: string, now = new Date()) {
  const checkoutToken = randomUUID();
  const orderNumber = `TL-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const shippingSettings = await getShippingSettings();

  const order = await prisma.$transaction(async (tx) => {
    if (userId) {
      const openOrders = await tx.order.count({
        where: {
          userId,
          paymentMethod: "COD",
          paymentStatus: "UNPAID",
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED"] },
        },
      });
      if (openOrders >= 3) throw new CheckoutError("You already have several open orders. Complete or receive one before placing another.");
    }
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: { discountCode: true, items: { include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }], take: 1 } } }, variant: true } } },
    });
    if (!cart?.items.length) throw new CheckoutError("Your bag is empty.");

    const lines = cart.items.map((item) => {
      const stock = item.variant?.stockQuantity ?? item.product.stockQuantity;
      if (item.product.status !== "ACTIVE" || stock < item.quantity) throw new CheckoutError(`${item.product.title} is no longer available in the requested quantity.`);
      const price = item.variant?.price ?? item.product.price;
      return { item, price, compareAtPrice: item.product.compareAtPrice, total: price.mul(item.quantity) };
    });
    const merchandise = calculateMerchandiseTotals(lines.map((line) => ({ price: Number(line.price), compareAtPrice: line.compareAtPrice ? Number(line.compareAtPrice) : null, quantity: line.item.quantity })));
    let couponDiscount = 0;
    if (cart.discountCode) {
      const coupon = await evaluateDiscountRecord(tx, cart.discountCode, merchandise.subtotal, userId, now);
      if (!coupon.ok) throw new CheckoutError(`Discount code ${coupon.code}: ${coupon.reason} Remove it from your bag to continue.`);
      couponDiscount = coupon.amount;
    }
    const amountDue = Math.max(0, merchandise.subtotal - couponDiscount);
    const shippingCost = calculateShipping(amountDue, input.governorate, shippingSettings);
    const total = amountDue + shippingCost;

    for (const { item } of lines) {
      if (item.variantId) {
        const changed = await tx.productVariant.updateMany({ where: { id: item.variantId, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
        if (changed.count !== 1) throw new CheckoutError(`${item.product.title} sold out while you were checking out.`);
      }
      const changed = await tx.product.updateMany({ where: { id: item.productId, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
      if (changed.count !== 1) throw new CheckoutError(`${item.product.title} sold out while you were checking out.`);
    }

    const saved = await tx.order.create({
      data: {
        orderNumber,
        checkoutToken,
        userId,
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        inventoryReservedAt: now,
        subtotal: merchandise.originalSubtotal,
        shippingCost,
        discount: merchandise.discount + couponDiscount,
        couponDiscount,
        discountCodeId: couponDiscount > 0 ? cart.discountCode?.id : null,
        discountCode: couponDiscount > 0 ? cart.discountCode?.code : null,
        total,
        customerEmail: input.email,
        customerPhone: input.phone,
        customerName: `${input.firstName} ${input.lastName}`,
        notes: input.notes || null,
        shippingAddress: {
          firstName: input.firstName, lastName: input.lastName, street: input.street,
          apartment: input.apartment || null, city: input.city, governorate: input.governorate,
          postalCode: input.postalCode || null, country: "EG", phone: input.phone,
        },
        items: { create: lines.map(({ item, price, total: lineTotal }) => ({
          productId: item.productId,
          variantId: item.variantId,
          title: item.product.title,
          sku: item.variant?.sku ?? item.product.sku,
          variantTitle: item.variant?.title,
          imageUrl: item.variant?.image ?? item.product.images[0]?.url,
          quantity: item.quantity,
          price,
          total: lineTotal,
        })) },
        payments: { create: { provider: "COD", status: "PENDING", amount: total, currency: "EGP", idempotencyKey: `cod:${checkoutToken}` } },
      },
    });
    await tx.cartItem.deleteMany({ where: { cartId } });
    if (cart.discountCodeId) await tx.cart.update({ where: { id: cartId }, data: { discountCodeId: null } });
    return saved;
  }, { isolationLevel: "Serializable" });

  return { orderId: order.id, cartId, orderNumber: order.orderNumber, checkoutToken: order.checkoutToken };
}

export async function getOrderForConfirmation(orderNumber: string) {
  const session = await getCurrentSession();
  if (!session || session.user.banned) return null;
  return prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { items: { include: { product: { select: { slug: true } } } } },
  });
}

export async function getCustomerOrders(userId: string) {
  return prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: "desc" } });
}
