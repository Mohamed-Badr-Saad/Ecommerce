"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CollectionCard = { id: string; slug: string; name: string; description: string | null; image: string | null };

const SPEED_PX_PER_SECOND = 40;
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
 * "Shop by mood" strip on the homepage: every active collection, moving continuously
 * from right to left. It pauses on mouse hover, keyboard focus and touch, and can be
 * dragged sideways on touch screens. Same mechanics as the customer feedback slider.
 */
export function CollectionsSlider({ collections }: { collections: CollectionCard[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const positionRef = useRef(0);
  const setWidthRef = useRef(0);
  const holdRef = useRef({ touch: false, focus: false });
  const dragRef = useRef<{ startX: number; startY: number; startPosition: number; moved: boolean; horizontal: boolean | null } | null>(null);
  const suppressClickRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list || !collections.length) return;
    const measure = () => {
      const first = list.children[0] as HTMLElement | undefined;
      const second = list.children[collections.length] as HTMLElement | undefined;
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
  }, [collections.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!collections.length || !viewport) return;
    const speed = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? REDUCED_MOTION_SPEED_PX_PER_SECOND : SPEED_PX_PER_SECOND;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const timers = resumeTimer;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const elapsed = Math.min(now - last, 100);
      last = now;
      const hold = holdRef.current;
      if (hold.focus && !viewport.contains(document.activeElement)) hold.focus = false;
      const hovered = canHover.matches && viewport.matches(":hover");
      if (!hovered && !hold.touch && !hold.focus && !document.hidden && setWidthRef.current > 0) {
        positionRef.current += (speed * elapsed) / 1000;
        applyPosition(listRef.current, positionRef, setWidthRef.current);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timers.current);
    };
  }, [collections.length]);

  if (!collections.length) return null;

  const onTouchStart = (event: React.TouchEvent) => {
    clearTimeout(resumeTimer.current);
    holdRef.current.touch = true;
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
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { holdRef.current.touch = false; }, RESUME_AFTER_TOUCH_MS);
  };

  // The list is repeated so the movement can wrap around seamlessly.
  const loop = Array.from({ length: copies }, () => collections).flat();

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label="Collections"
      className="mt-10 touch-pan-y overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onFocus={(event) => { if (event.target.matches(":focus-visible")) holdRef.current.focus = true; }}
      onBlur={() => { holdRef.current.focus = false; }}
      onClickCapture={(event) => {
        // A swipe should not also open the collection it started on.
        if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); suppressClickRef.current = false; }
      }}
    >
      <ul ref={listRef} className="flex w-max gap-4 px-5 will-change-transform sm:gap-5 sm:px-8 lg:px-12">
        {loop.map((collection, index) => {
          const duplicate = index >= collections.length;
          return (
            <li key={`${collection.id}-${index}`} className="w-72 shrink-0 sm:w-80 lg:w-96" inert={duplicate || undefined}>
              <Link href={`/collections/${collection.slug}`} draggable={false} className="group relative block overflow-hidden bg-muted">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={collection.image ?? "/editorial/hero.svg"}
                    alt={duplicate ? "" : `${collection.name} collection`}
                    fill
                    draggable={false}
                    sizes="(min-width: 1024px) 24rem, (min-width: 640px) 20rem, 18rem"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                  <h3 className="font-heading text-3xl tracking-tight">{collection.name}</h3>
                  {collection.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">{collection.description}</p> : null}
                  <span className="mt-4 inline-block border-b border-white pb-1 text-sm">Discover the collection</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
