import { Heart, Menu, Search, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCart } from "@/lib/cart";
import { hasAdminAccess } from "@/lib/admin";
import { getCurrentSession } from "@/lib/session";

const navigation = [
  { label: "New arrivals", href: "/shop?sort=newest" },
  { label: "Shop", href: "/shop" },
];

export async function SiteHeader() {
  const [cart, session] = await Promise.all([getCart(), getCurrentSession()]);
  const visibleNavigation = hasAdminAccess(session?.user)
    ? [...navigation, { label: "Admin", href: "/admin" }]
    : navigation;
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="bg-primary px-4 py-2 text-center text-[0.68rem] font-medium uppercase tracking-[0.18em] text-primary-foreground">
        Complimentary delivery on orders over EGP 2,500
      </div>
      <div className="mx-auto grid h-20 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(90vw,24rem)] px-6">
              <SheetHeader className="px-0 pt-7 text-left">
                <SheetTitle><BrandLogo /></SheetTitle>
                <SheetDescription>Crafted for the modern hijabi.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="mt-9 flex flex-col">
                {visibleNavigation.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link href={item.href} className={`flex items-center gap-2 border-b border-border py-5 font-heading text-2xl ${item.href === "/admin" ? "text-primary" : ""}`}>
                      {item.href === "/admin" ? <ShieldCheck className="size-5" aria-hidden="true" /> : null}
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
            {visibleNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs font-medium uppercase tracking-[0.13em] transition-opacity hover:opacity-55 ${item.href === "/admin" ? "text-primary" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label="Talié home">
          <BrandLogo compact />
        </Link>

        <div className="flex items-center justify-end gap-0.5">
          <Button asChild variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex"><Link href="/shop"><Search /></Link></Button>
          <Button asChild variant="ghost" size="icon" aria-label="Account"><Link href={session ? "/account" : "/sign-in?callbackURL=/shop"}><UserRound /></Link></Button>
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist" className="hidden md:inline-flex"><Link href="/account/wishlist"><Heart /></Link></Button>
          <Button asChild variant="ghost" size="icon" className="relative"><Link href="/cart" aria-label={`Shopping bag, ${cart.count} items`}><ShoppingBag />
            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] text-primary-foreground">{cart.count > 99 ? "99+" : cart.count}</span>
          </Link></Button>
        </div>
      </div>
    </header>
  );
}
