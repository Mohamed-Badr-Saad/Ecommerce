import { AlertTriangle, Banknote, Boxes, CreditCard, PackageCheck, Shirt, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboard } from "@/lib/admin";
import { formatEgp } from "@/lib/storefront";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();
  const metricCards = [
    { label: "Paid revenue", value: formatEgp(dashboard.metrics.paidRevenue), icon: Banknote },
    { label: "All orders", value: dashboard.metrics.orderCount.toLocaleString("en-EG"), icon: PackageCheck },
    { label: "Pending payments", value: dashboard.metrics.pendingPayments.toLocaleString("en-EG"), icon: CreditCard },
    { label: "Customers", value: dashboard.metrics.customerCount.toLocaleString("en-EG"), icon: UsersRound },
    { label: "Active products", value: dashboard.metrics.activeProducts.toLocaleString("en-EG"), icon: Shirt },
    { label: "Low-stock options", value: dashboard.metrics.lowStockCount.toLocaleString("en-EG"), icon: AlertTriangle },
  ];

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operations overview</p>
      <h2 className="mt-3 font-heading text-5xl tracking-[-0.04em]">Dashboard</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">Live commerce, customer, payment, and inventory signals from the Talié database.</p>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map(({ label, value, icon: Icon }) => <Card key={label} className="rounded-none"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><Icon className="size-4 text-primary" aria-hidden="true" /></div></CardHeader><CardContent><p className="font-heading text-4xl">{value}</p></CardContent></Card>)}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Card className="overflow-hidden rounded-none">
          <CardHeader><CardTitle className="font-heading text-3xl">Recent orders</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto px-0">
            {dashboard.recentOrders.length ? <table className="w-full min-w-[42rem] text-left text-sm"><thead className="border-y border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Payment</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">Total</th></tr></thead><tbody className="divide-y divide-border">{dashboard.recentOrders.map((order) => <tr key={order.id}><td className="px-6 py-4 font-medium">{order.orderNumber}</td><td className="px-4 py-4">{order.customerName}</td><td className="px-4 py-4"><Badge variant="outline" className="rounded-none">{order.paymentStatus.toLowerCase()}</Badge></td><td className="px-4 py-4"><Badge className="rounded-none">{order.status.toLowerCase()}</Badge></td><td className="px-6 py-4 text-right">{formatEgp(Number(order.total))}</td></tr>)}</tbody></table> : <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center"><Boxes className="size-7 text-primary" aria-hidden="true" /><p className="mt-3 font-medium">No orders yet</p><p className="mt-1 text-sm text-muted-foreground">New storefront orders will appear here.</p></div>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Low stock</CardTitle></CardHeader><CardContent>{dashboard.lowStockVariants.length ? <ul className="divide-y divide-border">{dashboard.lowStockVariants.map((variant) => <li key={variant.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-medium">{variant.product.title}</p><p className="text-xs text-muted-foreground">{variant.title} · {variant.sku}</p></div><Badge variant={variant.stockQuantity === 0 ? "destructive" : "outline"} className="rounded-none">{variant.stockQuantity}</Badge></li>)}</ul> : <p className="py-8 text-center text-sm text-muted-foreground">All active options are comfortably stocked.</p>}</CardContent></Card>
          <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Activity</CardTitle></CardHeader><CardContent>{dashboard.recentActivity.length ? <ul className="space-y-4">{dashboard.recentActivity.map((entry) => <li key={entry.id} className="text-sm"><p><span className="font-medium">{entry.admin.name}</span> · {entry.action}</p><p className="mt-1 text-xs text-muted-foreground">{entry.entityType} · {entry.timestamp.toLocaleString("en-EG")}</p></li>)}</ul> : <div className="py-8 text-center"><p className="text-sm font-medium">No admin activity yet</p><p className="mt-1 text-xs text-muted-foreground">Protected mutations will be recorded here.</p></div>}</CardContent></Card>
        </div>
      </div>
    </section>
  );
}
