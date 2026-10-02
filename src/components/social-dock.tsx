"use client";

import { Heart, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import type { SocialKey, SocialLinks } from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, XIcon } from "./social-icons";

const ORDER: { key: SocialKey; label: string; Icon: typeof InstagramIcon }[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "x", label: "X (Twitter)", Icon: XIcon },
  { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon },
];

/**
 * The store's social accounts, pinned to the bottom-right corner of every storefront page.
 * Larger screens show the icons in a column; phones show one button that opens them,
 * so the icons never cover the page. Accounts the admin hasn't added are left out.
 */
export function SocialDock({ links }: { links: SocialLinks }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();

  const items = ORDER.filter(({ key }) => links[key]);
  if (!items.length || pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Talié on social media"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-center gap-2 print:hidden md:right-5 md:bottom-6"
    >
      <ul id={listId} className={cn("flex-col items-center gap-2", open ? "flex" : "hidden md:flex")}>
        {items.map(({ key, label, Icon }) => (
          <li key={key}>
            <a
              href={links[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key === "whatsapp" ? "Chat with Talié on WhatsApp" : `Talié on ${label}`}
              title={label}
              onClick={() => setOpen(false)}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:size-10"
            >
              <Icon className="size-[1.15rem]" />
            </a>
          </li>
        ))}
      </ul>
      {/* Phones only: one button that shows or hides the icons. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? "Hide social media links" : "Follow Talié on social media"}
        className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Heart className="size-5" aria-hidden="true" />}
      </button>
    </nav>
  );
}
