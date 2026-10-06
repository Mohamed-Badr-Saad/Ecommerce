import type { SVGProps } from "react";

import type { SocialKey } from "@/lib/social-links";

/** Simple outline icons for the social accounts, drawn to match the site's other (lucide) icons. */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </Base>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 2.5v12.3a4.2 4.2 0 1 1-4.2-4.2" />
      <path d="M14 2.5c.5 3 2.7 5.2 5.6 5.4" />
    </Base>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17 2.5h-2.8A4.7 4.7 0 0 0 9.5 7.2V10H7v3.8h2.5v7.7h3.8v-7.7h2.9l.8-3.8h-3.7V7.6c0-.6.5-1.1 1.1-1.1H17z" />
    </Base>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 4h4.6L20 20h-4.6z" />
      <path d="M19.5 4l-6.6 7.4M11.1 12.6 4.5 20" />
    </Base>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3.6 20.4l1.2-4.1a8.6 8.6 0 1 1 3.3 3.1z" />
      <path d="M9.2 8.4c.2-.5.6-.6.9-.6h.5l1 2.2-.7.9a5.3 5.3 0 0 0 2.6 2.6l.9-.7 2.2 1v.5c0 .3-.1.7-.6.9-1.7.9-6.1-2.6-6.8-5.1-.2-.6-.1-1.2 0-1.7z" />
    </Base>
  );
}

/** The order and names used wherever the store's social accounts are listed (corner buttons and footer). */
export const SOCIAL_ICONS: { key: SocialKey; label: string; Icon: typeof InstagramIcon }[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "x", label: "X (Twitter)", Icon: XIcon },
  { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon },
];
