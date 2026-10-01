import { PackageCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingPaymentActions } from "@/components/pending-payment-actions";
import { getCustomerOrders } from "@/lib/orders";
import { pendingPaymentOptions, releaseExpiredOrdersForUser } from "@/lib/pending-payments";
import { requireSession } from "@/lib/session";
import { formatEgp } from "@/lib/storefront";

const paymentLabels = { COD: "Cash on delivery", PAYMOB: "Online payment" } as const;

export default async function OrdersPage() {
  const session = await requireSession();
  const released = await releaseExpiredOrdersForUser(session.user.id);
  const orders = await getCustomerOrders(session.user.id);
  const now = new Date();

  return (
    <section>
      <h2 className="font-heading text-4xl">Your orders</h2>
      <p className="mt-2 text-muted-foreground">Review every order and its latest payment and fulfillment status.</p>
      {released ? <p role="status" className="mt-5 border border-primary/25 bg-card p-3 text-sm">{released === 1 ? "An unpaid online order" : `${released} unpaid online orders`} passed the one-hour payment window, so the pieces were moved back to <Link href="/cart" className="underline underline-offset-4">your bag</Link>.</p> : null}
      {orders.length ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const options = pendingPaymentOptions(order, now);
            return <div key={order.id} className="space-y-2">
            <Link href={`/order-confirmation/${order.orderNumber}`} className="block">
              <Card className="rounded-none transition-colors hover:bg-secondary/40">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-2xl">{order.orderNumber}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="rounded-none">{order.paymentStatus.toLowerCase()}</Badge>
                      <Badge className="rounded-none">{order.status.toLowerCase()}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
                  <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items · {paymentLabels[order.paymentMethod]}</span>
                  <span>{formatEgp(Number(order.total))}</span>
                </CardContent>
              </Card>
            </Link>
            {options.pending ? <PendingPaymentActions orderNumber={order.orderNumber} options={options} expiresAt={order.reservationExpiresAt?.toISOString() ?? null} /> : null}
            </div>;
          })}
        </div>
      ) : (
        <div className="mt-8 flex min-h-80 flex-col items-center justify-center border border-border bg-card px-6 text-center">
          <PackageCheck className="size-8 text-primary" aria-hidden="true" />
          <h3 className="mt-4 font-heading text-3xl">No orders yet</h3>
          <p className="mt-2 text-muted-foreground">Your first Talié order will appear here.</p>
        </div>
      )}
    </section>
  );
}
