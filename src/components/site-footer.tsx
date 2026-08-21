import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
const footerLinks = [
  { label: "New arrivals", href: "/#new-arrivals" },
  { label: "Collections", href: "/#collections" },
  { label: "Our story", href: "/#newsletter" },
  { label: "Contact", href: "mailto:hello@talie.example" },
];

export function SiteFooter() {
  return (
    <footer className="bg-secondary/55">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr] lg:px-12">
        <div>
          <Link href="/" aria-label="Talié home"><BrandLogo /></Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Crafted for the Modern Hijabi<span aria-hidden="true"> 🤍</span>
          </p>
        </div>
        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {footerLinks.map((link) => (
            <Link key={link.label} href={link.href} className="hover:underline">{link.label}</Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/80 px-5 py-5 text-center text-xs text-muted-foreground sm:px-8">
        © {new Date().getFullYear()} Talié. All rights reserved.
      </div>
    </footer>
  );
}
