import { randomUUID } from "node:crypto";

import { calculateShipping, type CheckoutInput } from "./commerce";
import { getMutableCartId } from "./cart";
import { prisma } from "./prisma";
import { getCurrentSession } from "./session";

export class CheckoutError extends Error {}

export async function createCodOrder(input: CheckoutInput) {
  const [cartId, session] = await Promise.all([getMutableCartId(), getCurrentSession()]);
  return createCodOrderFromCart(cartId, input, session?.user.id);
}

export async function createCodOrderFromCart(cartId: string, input: CheckoutInput, userId?: string) {
  const checkoutToken = randomUUID();
  const orderNumber = `TL-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }], take: 1 } } }, variant: true } } },
    });
    if (!cart?.items.length) throw new CheckoutError("Your bag is empty.");

    const lines = cart.items.map((item) => {
      const stock = item.variant?.stockQuantity ?? item.product.stockQuantity;
      if (item.product.status !== "ACTIVE" || stock < item.quantity) throw new CheckoutError(`${item.product.title} is no longer available in the requested quantity.`);
      const price = item.variant?.price ?? item.product.price;
      return { item, price, total: price.mul(item.quantity) };
    });
    const subtotal = lines.reduce((total, line) => total + Number(line.total), 0);
    const shippingCost = calculateShipping(subtotal, input.governorate);
    const total = subtotal + shippingCost;

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
        subtotal,
        shippingCost,
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
    return saved;
  }, { isolationLevel: "Serializable" });

  return { orderNumber: order.orderNumber, checkoutToken: order.checkoutToken };
}

export async function getOrderForConfirmation(orderNumber: string, token?: string) {
  const session = await getCurrentSession();
  return prisma.order.findFirst({
    where: { orderNumber, OR: [{ checkoutToken: token ?? "" }, ...(session?.user.id ? [{ userId: session.user.id }] : [])] },
    include: { items: true },
  });
}

export async function getCustomerOrders(userId: string) {
  return prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: "desc" } });
}
