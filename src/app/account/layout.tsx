import { Heart, House, MapPin, PackageCheck, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireSession } from "@/lib/session";

const accountNav = [
  { href: "/account", label: "Overview", icon: House },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/orders", label: "Orders", icon: PackageCheck },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <header className="mb-10"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Your Talié account</p><h1 className="mt-3 font-heading text-5xl tracking-[-0.04em]">Hello, {session.user.name.split(" ")[0]}</h1></header>
      <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start"><nav aria-label="Account navigation" className="flex gap-2 overflow-x-auto border-b border-border pb-4 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">{accountNav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex shrink-0 items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"><Icon className="size-4" />{label}</Link>)}{session.user.role === "ADMIN" ? <Link href="/admin" className="flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-secondary"><ShieldCheck className="size-4" />Admin studio</Link> : null}<SignOutButton /></nav></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
