"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SectionNavItem = { href: string; label: string; icon: React.ReactNode; tone?: "accent" };

type Props = {
  label: string;
  items: SectionNavItem[];
  /** Exact-match href for the section root, e.g. "/admin" or "/account". */
  rootHref: string;
  /** Extra controls under the links, such as the sign-out button. */
  footer?: React.ReactNode;
  variant?: "admin" | "account";
};

function isActive(pathname: string, href: string, rootHref: string) {
  return href === rootHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Section navigation for the account and admin areas.
 * Phones get a "current page" button that opens a tidy grid of every section
 * (instead of a sideways-scrolling strip); larger screens get a vertical sidebar list.
 */
export function SectionNav({ label, items, rootHref, footer, variant = "account" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = items.find((item) => isActive(pathname, item.href, rootHref)) ?? items[0];

  const linkClass = (item: SectionNavItem, active: boolean) => cn(
    "flex items-center gap-3 border px-3 py-2.5 text-sm transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : item.tone === "accent"
        ? "border-primary/30 bg-card font-medium text-primary hover:bg-secondary"
        : variant === "admin"
          ? "border-border bg-card hover:border-primary/40 hover:bg-secondary"
          : "border-transparent hover:bg-secondary",
  );

  return (
    <nav aria-label={label}>
      {/* Phones and tablets */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 border border-border bg-card px-4 py-3 text-left text-sm"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="text-primary">{current?.icon}</span>
            <span className="min-w-0">
              <span className="block text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
              <span className="block truncate font-medium">{current?.label}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">{open ? "Close" : "All sections"}<ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" /></span>
        </button>
        {open ? (
          <div className="mt-2 border border-border bg-card p-2">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((item) => {
                const active = isActive(pathname, item.href, rootHref);
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={linkClass(item, active)}>
                      {item.icon}<span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {footer ? <div className="mt-2 border-t border-border pt-2">{footer}</div> : null}
          </div>
        ) : null}
      </div>

      {/* Laptops and desktops */}
      <div className="hidden flex-col gap-1.5 lg:flex">
        {items.map((item) => {
          const active = isActive(pathname, item.href, rootHref);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={linkClass(item, active)}>
              {item.icon}{item.label}
            </Link>
          );
        })}
        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>
    </nav>
  );
}
