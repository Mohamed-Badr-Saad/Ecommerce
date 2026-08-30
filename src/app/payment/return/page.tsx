import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOrderForConfirmation } from "@/lib/orders";
import { reconcilePaymobOrderPayment } from "@/lib/paymob-reconciliation";

type Props = { searchParams: Promise<{ orderNumber?: string }> };

export const metadata = { title: "Payment status" };

export default async function PaymentReturnPage({ searchParams }: Props) {
  const { orderNumber } = await searchParams;
  let order = orderNumber ? await getOrderForConfirmation(orderNumber) : null;
  if (order?.paymentMethod === "PAYMOB" && order.paymentStatus === "PENDING") {
    try {
      await reconcilePaymobOrderPayment(order.id);
      order = await getOrderForConfirmation(order.orderNumber);
    } catch {
      // The signed webhook remains authoritative if the inquiry service is temporarily unavailable.
    }
  }
  const paid = order?.paymentStatus === "PAID";
  const failed = order?.paymentStatus === "FAILED";
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock3;

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-5 py-16 text-center">
      <section className="w-full border border-border bg-card px-6 py-14 sm:px-12">
        <Icon className={`mx-auto size-11 ${paid ? "text-emerald-700" : failed ? "text-destructive" : "text-primary"}`} aria-hidden="true" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Paymob test checkout</p>
        <h1 className="mt-3 font-heading text-5xl tracking-[-0.04em]">
          {paid ? "Payment received" : failed ? "Payment unsuccessful" : "Confirming payment"}
        </h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">
          {paid
            ? `Your order ${order?.orderNumber} is confirmed.`
            : failed
              ? "The reserved stock has been returned. You can add the pieces again and retry."
              : "We are waiting for Paymob’s signed confirmation. Refresh this page in a few moments; the redirect itself never changes your order status."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order ? <Button asChild className="rounded-none"><Link href={`/order-confirmation/${order.orderNumber}`}>View order</Link></Button> : null}
          <Button asChild variant="outline" className="rounded-none"><Link href={failed ? "/shop" : "/account/orders"}>{failed ? "Return to shop" : "My orders"}</Link></Button>
        </div>
      </section>
    </main>
  );
}
