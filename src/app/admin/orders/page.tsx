import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminOrders } from "@/lib/admin-orders";
import { formatEgp } from "@/lib/storefront";

export const metadata = { title: "Orders | Admin" };

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Sales</p><h2 className="mt-3 font-heading text-5xl">Orders</h2><p className="mt-3 text-muted-foreground">Check payments and update each order as you pack, ship and deliver it.</p></div><Button asChild variant="outline" className="rounded-none"><a href="/api/admin/orders.csv">Export CSV</a></Button></div><Card className="mt-8 overflow-hidden rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">All orders</CardTitle></CardHeader><CardContent className="overflow-x-auto px-0">{orders.length ? <table className="w-full min-w-[52rem] text-left text-sm"><thead className="border-y bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Items</th><th className="px-6 py-3 text-right">Total</th></tr></thead><tbody className="divide-y">{orders.map((order) => <tr key={order.id}><td className="px-6 py-4"><Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{order.orderNumber}</Link><p className="text-xs text-muted-foreground">{order.createdAt.toLocaleString("en-EG")}</p></td><td className="px-4 py-4">{order.customerName}<p className="text-xs text-muted-foreground">{order.customerEmail}</p></td><td className="px-4 py-4"><Badge variant="outline" className="rounded-none">{order.paymentMethod.toLowerCase()} · {order.paymentStatus.toLowerCase()}</Badge></td><td className="px-4 py-4"><Badge className="rounded-none">{order.status.toLowerCase()}</Badge></td><td className="px-4 py-4">{order._count.items}</td><td className="px-6 py-4 text-right">{formatEgp(Number(order.total))}</td></tr>)}</tbody></table> : <p className="p-10 text-center text-muted-foreground">No orders yet.</p>}</CardContent></Card></section>;
}
