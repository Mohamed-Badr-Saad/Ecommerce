import { CheckCircle2, PackageCheck, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderPlacedToast } from "@/components/order-placed-toast";
import { OrderTracking } from "@/components/order-tracking";
import { PrintOrderButton } from "@/components/print-order-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderForConfirmation } from "@/lib/orders";
import { formatEgp } from "@/lib/storefront";

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ placed?: string; addressSaved?: string }> };

const placedFormat = new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const order = await getOrderForConfirmation(orderNumber);
  if (!order) notFound();

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
      <div className="flex items-start justify-between gap-4">
        <Icon className={`size-10 ${cancelled ? "text-destructive" : "text-primary"}`} aria-hidden="true" />
        <PrintOrderButton />
      </div>
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
          {order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.quantity} × {item.title}{item.variantTitle ? ` · ${item.variantTitle}` : ""}</span><span>{formatEgp(Number(item.total))}</span></div>)}
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
