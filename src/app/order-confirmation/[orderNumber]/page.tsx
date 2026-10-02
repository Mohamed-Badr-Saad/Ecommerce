import { CheckCircle2, PackageCheck, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OrderPlacedToast } from "@/components/order-placed-toast";
import { OrderTracking } from "@/components/order-tracking";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderForConfirmation } from "@/lib/orders";
import { getCurrentSession } from "@/lib/session";
import { formatEgp } from "@/lib/storefront";

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ placed?: string; addressSaved?: string }> };

const placedFormat = new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  // Not signed in (or the session expired): sign in, then come straight back to this order.
  const session = await getCurrentSession();
  if (!session) redirect(`/sign-in?callbackURL=${encodeURIComponent(`/order-confirmation/${orderNumber}`)}`);
  const order = await getOrderForConfirmation(orderNumber);
  if (!order) return <OrderNotInAccount email={session.user.email} />;

  const address = order.shippingAddress as Record<string, string | null>;
  const paid = order.paymentStatus === "PAID";
  const cancelled = order.status === "CANCELLED" || order.paymentStatus === "FAILED";
  const shipped = order.status === "SHIPPED";
  const delivered = order.status === "DELIVERED";
  const Icon = cancelled ? XCircle : shipped ? Truck : CheckCircle2;
  const eyebrow = cancelled ? "Order cancelled" : delivered ? "Delivered" : shipped ? "On its way" : "Order confirmed";
  const title = cancelled
    ? "This order was cancelled."
    : delivered
      ? "Your order has arrived."
      : shipped
        ? "Your order is on its way."
        : `Thank you, ${order.customerName.split(" ")[0]}.`;
  const payment = paid
    ? `We received your payment of ${formatEgp(Number(order.total))}.`
    : `Payment of ${formatEgp(Number(order.total))} is due in cash on delivery.`;
  const summary = cancelled
    ? `Order ${order.orderNumber} was cancelled and its pieces were returned to stock.`
    : delivered
      ? `Order ${order.orderNumber} was delivered. We hope you love it. ${payment}`
      : shipped
        ? `Order ${order.orderNumber} has left our studio.${order.trackingNumber ? " Use the tracking details below to follow it." : ""} ${payment}`
        : `We received order ${order.orderNumber}. ${payment}`;

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      {query.placed ? <OrderPlacedToast orderNumber={order.orderNumber} addressSaved={Boolean(query.addressSaved)} /> : null}
      <Icon className={`size-10 ${cancelled ? "text-destructive" : "text-primary"}`} aria-hidden="true" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-3 font-heading text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{summary}</p>
      <OrderTracking order={order} />
      <div id="order-details" className="mt-6 scroll-mt-32 border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3"><PackageCheck className="size-5 text-primary" aria-hidden="true" /><h2 className="font-heading text-3xl">Order details</h2></div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Order number</dt><dd className="mt-1 font-medium">{order.orderNumber}</dd><dd className="mt-1 text-muted-foreground">Placed {placedFormat.format(order.createdAt)}</dd></div>
          <div><dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Delivering to</dt><dd className="mt-1 leading-6">{order.customerName}<br />{address.street}{address.apartment ? `, ${address.apartment}` : ""}<br />{address.city}, {address.governorate}<br />{order.customerPhone}</dd></div>
        </dl>
        <Separator className="my-6" />
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.quantity} × {item.title}{item.variantTitle ? ` · ${item.variantTitle}` : ""}
                {/* Once delivered, customers can review what they bought. */}
                {delivered ? <Link href={`/products/${item.product.slug}#write-review`} className="mt-1 block text-xs text-primary underline underline-offset-4 print:hidden">Write a review</Link> : null}
              </span>
              <span>{formatEgp(Number(item.total))}</span>
            </div>
          ))}
        </div>
        <Separator className="my-6" />
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt>Payment</dt><dd>{order.paymentMethod === "COD" ? "Cash on delivery" : "Online payment"}</dd></div>
          <div className="flex justify-between"><dt>Payment status</dt><dd className="capitalize">{order.paymentStatus.toLowerCase()}</dd></div>
          <div className="flex justify-between"><dt>Items</dt><dd>{formatEgp(Number(order.subtotal))}</dd></div>
          {Number(order.discount) > 0 ? <div className="flex justify-between text-emerald-700"><dt>Total discount{order.discountCode ? ` (incl. code ${order.discountCode})` : ""}</dt><dd>−{formatEgp(Number(order.discount))}</dd></div> : null}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.shippingCost) ? formatEgp(Number(order.shippingCost)) : "Free"}</dd></div>
          <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatEgp(Number(order.total))}</dd></div>
        </dl>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 print:hidden">
        <Button asChild className="h-12 rounded-none px-7"><Link href="/shop">Continue shopping</Link></Button>
        {order.userId ? <Button asChild variant="outline" className="h-12 rounded-none px-7"><Link href="/account/orders">View your orders</Link></Button> : null}
      </div>
    </main>
  );
}

/** Shown when the signed-in customer doesn't own this order (or it doesn't exist) — without saying which. */
function OrderNotInAccount({ email }: { email: string }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
      <PackageCheck className="mx-auto size-9 text-primary" aria-hidden="true" />
      <h1 className="mt-5 font-heading text-4xl sm:text-5xl">We couldn&apos;t find this order in your account</h1>
      <p className="mt-4 leading-7 text-muted-foreground">You&apos;re signed in as <span className="font-medium text-foreground">{email}</span>. If you placed the order with a different account, sign out and sign in with that one.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="h-12 rounded-none px-7"><Link href="/account/orders">View your orders</Link></Button>
        <Button asChild variant="outline" className="h-12 rounded-none px-7"><Link href="/shop">Continue shopping</Link></Button>
      </div>
    </main>
  );
}

