import { Heart, MapPin, Package, UserRound } from "lucide-react";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const session = await requireSession();
  const [addresses, wishlistItems, orders] = await Promise.all([
    prisma.address.count({ where: { userId: session.user.id } }),
    prisma.wishlistItem.count({ where: { wishlist: { userId: session.user.id } } }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);
  const summaries = [
    { label: "Profile", value: session.user.email, href: "/account/profile", icon: UserRound },
    { label: "Saved addresses", value: `${addresses} saved`, href: "/account/addresses", icon: MapPin },
    { label: "Wishlist", value: `${wishlistItems} pieces`, href: "/account/wishlist", icon: Heart },
    { label: "Orders", value: `${orders} orders`, href: "/account", icon: Package },
  ];
  return <section><h2 className="font-heading text-4xl">Account overview</h2><p className="mt-2 text-muted-foreground">Your details, saved pieces, and order activity at a glance.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{summaries.map(({ label, value, href, icon: Icon }) => <Link href={href} key={label}><Card className="h-full rounded-none transition-colors hover:bg-secondary/40"><CardHeader><Icon className="mb-3 size-5 text-primary" /><CardTitle className="text-2xl">{label}</CardTitle><CardDescription>{value}</CardDescription></CardHeader></Card></Link>)}</div></section>;
}
