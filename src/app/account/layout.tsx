import { Heart, House, MapPin, PackageCheck, ShieldCheck, UserRound } from "lucide-react";

import { SectionNav } from "@/components/section-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { hasAdminAccess } from "@/lib/admin";
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
        <aside className="min-w-0 lg:sticky lg:top-32 lg:self-start lg:border-r lg:border-border lg:pr-6">
          <SectionNav
            label="My account"
            rootHref="/account"
            items={[
              ...accountNav.map(({ href, label, icon: Icon }) => ({ href, label, icon: <Icon className="size-4" aria-hidden="true" /> })),
              ...(hasAdminAccess(session.user) ? [{ href: "/admin", label: "Admin studio", icon: <ShieldCheck className="size-4" aria-hidden="true" />, tone: "accent" as const }] : []),
            ]}
            footer={<SignOutButton />}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
