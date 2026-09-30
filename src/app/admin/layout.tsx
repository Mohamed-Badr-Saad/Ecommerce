import { Activity, BarChart3, Images, LayoutDashboard, PackageSearch, Settings, ShoppingBag, Star, Store, TicketPercent, UsersRound } from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { requireAdminSession } from "@/lib/session";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, available: true },
  { label: "Catalog", href: "/admin/catalog", icon: PackageSearch, available: true },
  { label: "Content", href: "/admin/content", icon: Images, available: true },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag, available: true },
  { label: "Discounts", href: "/admin/discounts", icon: TicketPercent, available: true },
  { label: "Customers", href: "/admin/customers", icon: UsersRound, available: true },
  { label: "Reviews", href: "/admin/reviews", icon: Star, available: true },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, available: true },
  { label: "Activity", href: "/admin/activity", icon: Activity, available: true },
  { label: "Settings", href: "/admin/settings", icon: Settings, available: true },
] as const;

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const adminRole = session.user.adminRole!;
  return (
    <main className="min-h-[75vh] bg-secondary/25">
      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-border bg-card px-5 py-7 lg:min-h-[calc(100vh-7rem)] lg:border-b-0 lg:border-r lg:px-6">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Talié operations</p><h1 className="mt-2 font-heading text-3xl">Admin studio</h1><p className="mt-2 text-sm text-muted-foreground">{session.user.name}</p><Badge variant="outline" className="mt-3 rounded-none">{adminRole.toLowerCase().replaceAll("_", " ")}</Badge></div>
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Store className="size-4" aria-hidden="true" /> Storefront</Link>
          </div>
          <nav aria-label="Admin navigation" className="-mx-5 mt-7 flex snap-x gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible lg:pb-0">
            {navigation.map(({ label, href, icon: Icon, available }) => available ? (
              <Link key={label} href={href} className="flex shrink-0 snap-start items-center gap-3 bg-primary px-3 py-2.5 text-sm text-primary-foreground lg:w-full"><Icon className="size-4" aria-hidden="true" />{label}</Link>
            ) : (
              <span key={label} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground" aria-disabled="true"><Icon className="size-4" aria-hidden="true" />{label}<span className="ml-auto text-[0.6rem] uppercase tracking-wider">Soon</span></span>
            ))}
            <SignOutButton />
          </nav>
        </aside>
        <div className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-12">{children}</div>
      </div>
    </main>
  );
}
