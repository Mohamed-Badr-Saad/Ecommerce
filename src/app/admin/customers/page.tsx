import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminCustomers } from "@/lib/admin-operations";
import { formatEgp } from "@/lib/storefront";
import { setCustomerBanAction } from "../operations-actions";

export const metadata = { title: "Customers | Admin" };

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();
  return <section><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Relationships</p><h2 className="mt-3 font-heading text-5xl">Customers</h2><p className="mt-3 text-muted-foreground">Account history, paid value, and access controls.</p><Card className="mt-8 overflow-hidden rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Customer directory</CardTitle></CardHeader><CardContent className="overflow-x-auto px-0">{customers.length ? <table className="w-full min-w-[58rem] text-left text-sm"><thead className="border-y bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-6 py-3">Customer</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Paid value</th><th className="px-4 py-3">Joined</th><th className="px-6 py-3">Access</th></tr></thead><tbody className="divide-y">{customers.map((customer) => <tr key={customer.id}><td className="px-6 py-4"><p className="font-medium">{customer.name}</p><p className="text-xs text-muted-foreground">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p></td><td className="px-4 py-4">{customer._count.orders}</td><td className="px-4 py-4">{formatEgp(customer.orders.reduce((sum, order) => sum + Number(order.total), 0))}</td><td className="px-4 py-4">{customer.createdAt.toLocaleDateString("en-EG")}</td><td className="px-6 py-4">{customer.banned ? <form action={setCustomerBanAction.bind(null, customer.id, false)} className="flex items-center gap-2"><Badge variant="destructive" className="rounded-none">suspended</Badge><Button size="sm" variant="outline" className="rounded-none">Restore</Button></form> : <form action={setCustomerBanAction.bind(null, customer.id, true)} className="flex gap-2"><Input name="reason" placeholder="Suspension reason" className="w-44" required /><Button size="sm" variant="outline" className="rounded-none">Suspend</Button></form>}</td></tr>)}</tbody></table> : <p className="p-10 text-center text-muted-foreground">No customer accounts yet.</p>}</CardContent></Card></section>;
}
