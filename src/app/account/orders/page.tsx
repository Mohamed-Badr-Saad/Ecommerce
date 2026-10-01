import { PackageCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerOrders } from "@/lib/orders";
import { requireSession } from "@/lib/session";
import { formatEgp } from "@/lib/storefront";

// PAYMOB only appears on orders placed before online payment was switched off.
const paymentLabels = { COD: "Cash on delivery", PAYMOB: "Online payment" } as const;

export const metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const session = await requireSession();
  const orders = await getCustomerOrders(session.user.id);

  return (
    <section>
      <h2 className="font-heading text-4xl">Your orders</h2>
      <p className="mt-2 text-muted-foreground">Review every order and its latest payment and fulfillment status.</p>
      {orders.length ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/order-confirmation/${order.orderNumber}`} className="block">
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
          ))}
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
