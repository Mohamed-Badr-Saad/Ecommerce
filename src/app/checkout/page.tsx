import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { getCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [cart, session] = await Promise.all([getCart(), getCurrentSession()]);
  if (!session) redirect("/sign-up?callbackURL=/checkout");
  if (!cart.items.length) redirect("/cart");
  if (cart.items.some((item) => !item.available) || cart.coupon?.error) redirect("/cart");
  const address = await prisma.address.findFirst({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  const names = session.user.name.trim().split(/\s+/);
  const defaults = {
    firstName: address?.firstName ?? names[0] ?? "",
    lastName: address?.lastName ?? names.slice(1).join(" "),
    email: session.user.email,
    phone: address?.phone ?? session.user.phone ?? "",
    street: address?.street ?? "", apartment: address?.apartment ?? "", city: address?.city ?? "",
    governorate: address?.governorate ?? "", postalCode: address?.postalCode ?? "",
  };
  return <main className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"><CheckoutForm subtotal={cart.amountDue} originalSubtotal={cart.originalSubtotal} discount={cart.discount} coupon={cart.coupon && !cart.coupon.error ? { code: cart.coupon.code, amount: cart.couponDiscount } : null} defaults={defaults} /></main>;
}
