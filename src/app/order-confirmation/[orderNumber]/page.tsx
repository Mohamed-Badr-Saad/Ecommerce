import { CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderForConfirmation } from "@/lib/orders";
import { formatEgp } from "@/lib/storefront";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await getOrderForConfirmation(orderNumber);
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";
  const cancelled = order.status === "CANCELLED" || order.paymentStatus === "FAILED";
  const Icon = cancelled ? XCircle : CheckCircle2;
  const eyebrow = cancelled ? "Order cancelled" : "Order confirmed";
  const title = cancelled ? "This order was cancelled." : `Thank you, ${order.customerName.split(" ")[0]}.`;
  const summary = cancelled
    ? `Order ${order.orderNumber} was cancelled and its pieces were returned to stock.`
    : paid
      ? `We received your payment of ${formatEgp(Number(order.total))} for order ${order.orderNumber}.`
      : `We received order ${order.orderNumber}. Payment of ${formatEgp(Number(order.total))} is due in cash on delivery.`;

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <Icon className={`size-10 ${cancelled ? "text-destructive" : "text-primary"}`} aria-hidden="true" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-3 font-heading text-5xl">{title}</h1>
      <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{summary}</p>
      <div className="mt-10 border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3"><PackageCheck className="size-5 text-primary" aria-hidden="true" /><h2 className="font-heading text-3xl">Order details</h2></div>
        <div className="mt-6 space-y-4">
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
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="h-12 rounded-none px-7"><Link href="/shop">Continue shopping</Link></Button>
        {order.userId ? <Button asChild variant="outline" className="h-12 rounded-none px-7"><Link href="/account/orders">View your orders</Link></Button> : null}
      </div>
    </main>
  );
}
