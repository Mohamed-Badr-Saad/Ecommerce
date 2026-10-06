import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { getSocialLinks } from "@/lib/social-links";
import { SOCIAL_ICONS } from "./social-icons";

const footerLinks = [
  { label: "New arrivals", href: "/#new-arrivals" },
  { label: "Collections", href: "/#collections" },
  { label: "Share feedback", href: "/#feedback" },
  { label: "Contact", href: "mailto:hello@talie.example" },
];

export async function SiteFooter() {
  // The accounts the admin added in Settings → Social media (empty ones are left out).
  const links = await getSocialLinks();
  const socials = SOCIAL_ICONS.filter(({ key }) => links[key]);

  return (
    <footer className="bg-secondary/55 print:hidden">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr] lg:px-12">
        <div>
          <Link href="/" aria-label="Talié home"><BrandLogo /></Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Crafted for the Modern Hijabi<span aria-hidden="true"> 🤍</span>
          </p>
          {socials.length ? (
            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Follow Talié</p>
              <ul className="mt-3 flex flex-wrap gap-2.5" aria-label="Talié on social media">
                {socials.map(({ key, label, Icon }) => (
                  <li key={key}>
                    <a
                      href={links[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key === "whatsapp" ? "Chat with Talié on WhatsApp" : `Talié on ${label}`}
                      title={label}
                      className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <Icon className="size-[1.1rem]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <nav aria-label="Footer navigation" className="grid h-fit grid-cols-2 gap-x-8 gap-y-4 text-sm">
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
