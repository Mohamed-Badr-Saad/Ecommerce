"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  /** Rendered inside the trigger button, usually a thumbnail. */
  children: React.ReactNode;
  className?: string;
  caption?: React.ReactNode;
};

/**
 * A thumbnail button that opens the full image in an overlay (Esc, backdrop, or × closes it).
 * The overlay is portalled to <body> so moving/transformed parents (like the feedback slider)
 * can't trap its fixed positioning.
 */
export function ImageLightbox({ src, alt, children, className, caption }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label={`Enlarge: ${alt}`}>
        {children}
      </button>
      {open ? createPortal(
        <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 sm:p-8" onClick={() => setOpen(false)}>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close image" autoFocus>
            <X className="size-6" aria-hidden="true" />
          </button>
          <figure className="flex max-h-full max-w-full flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-[80vh] w-[min(92vw,56rem)]">
              <Image src={src} alt={alt} fill sizes="92vw" className="object-contain" />
            </div>
            {caption ? <figcaption className="mt-3 max-w-2xl text-center text-sm text-white/85">{caption}</figcaption> : null}
          </figure>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
