"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ImageLightbox } from "./image-lightbox";
import { SectionHeading } from "./section-heading";

type FeedbackItem = {
  id: string;
  image: string;
  imageWidth: number | null;
  imageHeight: number | null;
  altText: string | null;
  customerName: string | null;
  caption: string | null;
};

const SPEED_PX_PER_SECOND = 40;
const RESUME_AFTER_TOUCH_MS = 2500;
const MIN_ITEMS_TO_ANIMATE = 3;

/**
 * Continuously scrolling feedback slider. It pauses while hovered, touched, or focused,
 * can be swiped/scrolled by hand, and stays still for visitors who prefer reduced motion.
 */
export function CustomerFeedbackWall({ feedback }: { feedback: FeedbackItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pausedRef = useRef(false);
  const setWidthRef = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const animate = feedback.length >= MIN_ITEMS_TO_ANIMATE;
  // Enough copies of the list that one full set can scroll out of view before wrapping.
  const [copies, setCopies] = useState(animate ? 2 : 1);

  useEffect(() => {
    const track = trackRef.current;
    const list = listRef.current;
    if (!animate || !track || !list) return;
    const observer = new ResizeObserver(() => {
      const items = list.children;
      const second = items[feedback.length] as HTMLElement | undefined;
      const first = items[0] as HTMLElement | undefined;
      if (!first || !second) return;
      const setWidth = second.offsetLeft - first.offsetLeft;
      setWidthRef.current = setWidth;
      if (setWidth > 0) setCopies(Math.max(2, Math.ceil(track.clientWidth / setWidth) + 1));
    });
    observer.observe(track);
    observer.observe(list);
    return () => observer.disconnect();
  }, [animate, feedback.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!animate || !track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = resumeTimer;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    const step = (now: number) => {
      const elapsed = Math.min(now - last, 100);
      last = now;
      const setWidth = setWidthRef.current;
      if (!pausedRef.current && setWidth > 0) {
        carry += (SPEED_PX_PER_SECOND * elapsed) / 1000;
        const whole = Math.floor(carry);
        carry -= whole;
        let next = track.scrollLeft + whole;
        if (next >= setWidth) next -= setWidth;
        track.scrollLeft = next;
      } else if (setWidth > 0 && track.scrollLeft >= setWidth) {
        // Keep manual swipes inside the looping range too.
        track.scrollLeft -= setWidth;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timers.current);
    };
  }, [animate]);

  if (!feedback.length) return null;

  const pause = () => { clearTimeout(resumeTimer.current); pausedRef.current = true; };
  const resume = (delay = 0) => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, delay);
  };
  // The list is repeated so the scroll can wrap around seamlessly.
  const loop = Array.from({ length: copies }, () => feedback).flat();

  return (
    <section id="customer-love" className="border-b border-border">
      <div className="mx-auto max-w-[1600px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-28">
        <SectionHeading
          eyebrow="Customer love"
          title="In their words"
          description="Messages and reviews shared with us by the women who wear Talié."
        />
      </div>
      <div
        ref={trackRef}
        className="mt-10 overflow-x-auto pb-20 [scrollbar-width:none] lg:pb-28 [&::-webkit-scrollbar]:hidden"
        onPointerEnter={(event) => { if (event.pointerType === "mouse") pause(); }}
        onPointerLeave={(event) => { if (event.pointerType === "mouse") resume(); }}
        onTouchStart={pause}
        onTouchEnd={() => resume(RESUME_AFTER_TOUCH_MS)}
        onTouchCancel={() => resume(RESUME_AFTER_TOUCH_MS)}
        onFocus={pause}
        onBlur={() => resume()}
        aria-label="Customer feedback"
        role="region"
      >
        <ul ref={listRef} className="flex w-max gap-4 px-5 sm:gap-5 sm:px-8 lg:px-12">
          {loop.map((item, index) => {
            const duplicate = index >= feedback.length;
            const alt = item.altText ?? (item.customerName ? `Feedback from ${item.customerName}` : "Customer feedback screenshot");
            return (
              <li key={`${item.id}-${index}`} className="w-60 shrink-0 sm:w-72" inert={duplicate || undefined}>
                <figure className="flex h-full flex-col border border-border bg-card p-2 sm:p-3">
                  <ImageLightbox
                    src={item.image}
                    alt={alt}
                    className="relative block h-96 w-full overflow-hidden bg-muted sm:h-[28rem]"
                    caption={item.caption || item.customerName ? <>{item.caption}{item.customerName ? ` — ${item.customerName}` : ""}</> : undefined}
                  >
                    <Image src={item.image} alt={duplicate ? "" : alt} fill sizes="(min-width: 640px) 18rem, 15rem" className="object-contain" />
                  </ImageLightbox>
                  {item.caption || item.customerName ? (
                    <figcaption className="px-1 pb-1 pt-3 text-sm leading-6">
                      {item.caption ? <p className="flex gap-2 text-foreground/85"><Quote className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden="true" /><span className="line-clamp-3">{item.caption}</span></p> : null}
                      {item.customerName ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">— {item.customerName}</p> : null}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
