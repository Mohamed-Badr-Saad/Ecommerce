import { CheckCircle2, PackageCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderForConfirmation } from "@/lib/orders";
import { formatEgp } from "@/lib/storefront";

type Props = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string }> };

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const [{ orderNumber }, { token }] = await Promise.all([params, searchParams]);
  const order = await getOrderForConfirmation(orderNumber, token);
  if (!order) notFound();
  return <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24"><CheckCircle2 className="size-10 text-primary" /><p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Order confirmed</p><h1 className="mt-3 font-heading text-5xl">Thank you, {order.customerName.split(" ")[0]}.</h1><p className="mt-4 max-w-xl leading-7 text-muted-foreground">We’ve received order <span className="font-medium text-foreground">{order.orderNumber}</span>. Payment of {formatEgp(Number(order.total))} is due in cash on delivery.</p><div className="mt-10 border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-3"><PackageCheck className="size-5 text-primary" /><h2 className="font-heading text-3xl">Order details</h2></div><div className="mt-6 space-y-4">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.quantity} × {item.title}{item.variantTitle ? ` · ${item.variantTitle}` : ""}</span><span>{formatEgp(Number(item.total))}</span></div>)}</div><Separator className="my-6" /><dl className="space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatEgp(Number(order.subtotal))}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.shippingCost) ? formatEgp(Number(order.shippingCost)) : "Complimentary"}</dd></div><div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatEgp(Number(order.total))}</dd></div></dl></div><div className="mt-8 flex flex-wrap gap-3"><Button asChild className="h-12 rounded-none px-7"><Link href="/shop">Continue shopping</Link></Button>{order.userId ? <Button asChild variant="outline" className="h-12 rounded-none px-7"><Link href="/account/orders">View your orders</Link></Button> : null}</div></main>;
}
