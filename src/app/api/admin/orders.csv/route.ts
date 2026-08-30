import { auth } from "@/lib/auth";
import { csvCell } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.banned || session.user.role !== "ADMIN" || !session.user.adminRole) return new Response("Forbidden", { status: 403 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } });
  const rows = [["Order", "Created", "Customer", "Email", "Phone", "Status", "Payment", "Method", "Items", "Subtotal", "Discount", "Shipping", "Total", "Currency"], ...orders.map((order) => [order.orderNumber, order.createdAt.toISOString(), order.customerName, order.customerEmail, order.customerPhone, order.status, order.paymentStatus, order.paymentMethod, order._count.items, order.subtotal, order.discount, order.shippingCost, order.total, order.currency])];
  return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="talie-orders-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
