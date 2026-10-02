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

const SPEED_PX_PER_SECOND = 35;
// Slower, but still moving, for visitors whose system asks for reduced motion.
const REDUCED_MOTION_SPEED_PX_PER_SECOND = 15;
const RESUME_AFTER_TOUCH_MS = 2500;
const DRAG_THRESHOLD_PX = 8;

/** Wraps the position into one list width and moves the list there. */
function applyPosition(list: HTMLUListElement | null, position: { current: number }, width: number) {
  if (!list || width <= 0) return;
  position.current = ((position.current % width) + width) % width;
  list.style.transform = `translate3d(${-position.current}px, 0, 0)`;
}

/**
 * Continuously moving feedback slider. Movement is a transform driven by
 * requestAnimationFrame (not scrollLeft, which browsers round on scaled displays and
 * can stall). It pauses on mouse hover, keyboard focus, and touch; on touch screens it
 * can be dragged sideways. With "reduce motion" enabled it moves more slowly.
 */
export function CustomerFeedbackWall({ feedback }: { feedback: FeedbackItem[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const positionRef = useRef(0);
  const setWidthRef = useRef(0);
  // Independent reasons to hold still; the slider moves only when none is active.
  const holdRef = useRef({ touch: false, focus: false });
  const dragRef = useRef<{ startX: number; startY: number; startPosition: number; moved: boolean; horizontal: boolean | null } | null>(null);
  const suppressClickRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Enough copies of the list that one full set can move out of view before wrapping.
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list || !feedback.length) return;
    const measure = () => {
      const first = list.children[0] as HTMLElement | undefined;
      const second = list.children[feedback.length] as HTMLElement | undefined;
      if (!first || !second) return;
      const width = second.offsetLeft - first.offsetLeft;
      if (width <= 0) return;
      setWidthRef.current = width;
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / width) + 1));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(list);
    return () => observer.disconnect();
  }, [feedback.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!feedback.length || !viewport) return;
    const speed = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? REDUCED_MOTION_SPEED_PX_PER_SECOND : SPEED_PX_PER_SECOND;
    // Read hover from the browser's own :hover state each frame (only on real mouse/trackpad
    // devices) so it can't get stuck when an enlarged image closes outside the slider.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const timers = resumeTimer;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const elapsed = Math.min(now - last, 100);
      last = now;
      const hold = holdRef.current;
      // Focus can vanish without a blur event (e.g. a closed lightbox unmounts); recheck it.
      if (hold.focus && !viewport.contains(document.activeElement)) hold.focus = false;
      const hovered = canHover.matches && viewport.matches(":hover");
      if (!hovered && !hold.touch && !hold.focus && !document.hidden && setWidthRef.current > 0) {
        positionRef.current += (speed * elapsed) / 1000;
        applyPosition(listRef.current, positionRef, setWidthRef.current);
      }
      frame = requestAnimationFrame(step);
    };
    // Only animate while the slider is on (or near) the screen: smoother scrolling elsewhere
    // on the page and less battery use on phones.
    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()), { rootMargin: "100px" });
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      stop();
      clearTimeout(timers.current);
    };
  }, [feedback.length]);

  if (!feedback.length) return null;

  const holdForTouch = () => { clearTimeout(resumeTimer.current); holdRef.current.touch = true; };
  const releaseTouchLater = () => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { holdRef.current.touch = false; }, RESUME_AFTER_TOUCH_MS);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    holdForTouch();
    const touch = event.touches[0];
    if (!touch) return;
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosition: positionRef.current, moved: false, horizontal: null };
  };
  const onTouchMove = (event: React.TouchEvent) => {
    const drag = dragRef.current;
    const touch = event.touches[0];
    if (!drag || !touch) return;
    const dx = touch.clientX - drag.startX;
    const dy = touch.clientY - drag.startY;
    if (drag.horizontal === null && Math.max(Math.abs(dx), Math.abs(dy)) > DRAG_THRESHOLD_PX) drag.horizontal = Math.abs(dx) > Math.abs(dy);
    if (!drag.horizontal) return;
    drag.moved = true;
    positionRef.current = drag.startPosition - dx;
    applyPosition(listRef.current, positionRef, setWidthRef.current);
  };
  const onTouchEnd = () => {
    suppressClickRef.current = Boolean(dragRef.current?.moved);
    dragRef.current = null;
    releaseTouchLater();
  };

  // The list is repeated so the movement can wrap around seamlessly.
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
        ref={viewportRef}
        role="region"
        aria-label="Customer feedback"
        className="mt-10 touch-pan-y overflow-hidden pb-20 lg:pb-28"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onFocus={(event) => { if (event.target.matches(":focus-visible")) holdRef.current.focus = true; }}
        onBlur={() => { holdRef.current.focus = false; }}
        onClickCapture={(event) => {
          // A swipe should not also open the screenshot it started on.
          if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); suppressClickRef.current = false; }
        }}
      >
        <ul ref={listRef} className="flex w-max gap-4 px-5 will-change-transform sm:gap-5 sm:px-8 lg:px-12">
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
