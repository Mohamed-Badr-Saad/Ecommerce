"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

type Announcement = { id: string; text: string; link: string | null };

const SPEED_PX_PER_SECOND = 45;

/**
 * The strip at the top of every page. All messages sit side by side and scroll
 * continuously from right to left (a "ticker"); hovering or focusing it pauses the motion.
 */
export function AnnouncementBar({ announcements }: { announcements: Announcement[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  // How many copies of the message list fill one screen width, so the loop never shows a gap.
  const [repeat, setRepeat] = useState(1);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;
    if (!viewport || !group) return;
    const measure = () => {
      const groupWidth = group.getBoundingClientRect().width;
      if (!groupWidth) return;
      const copies = Math.max(1, Math.ceil(viewport.clientWidth / groupWidth));
      setRepeat(copies);
      setDuration((groupWidth * copies) / SPEED_PX_PER_SECOND);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(group);
    return () => observer.disconnect();
  }, [announcements]);

  if (!announcements.length) return null;

  const renderItems = (keyPrefix: string, measured: boolean) => (
    <div ref={measured ? groupRef : undefined} className="flex shrink-0 items-center" aria-hidden={measured ? undefined : true}>
      {announcements.map((item) => (
        <Fragment key={`${keyPrefix}-${item.id}`}>
          {item.link ? (
            <Link href={item.link} tabIndex={measured ? undefined : -1} className="whitespace-nowrap px-6 underline-offset-4 hover:underline focus-visible:underline">{item.text}</Link>
          ) : (
            <span className="whitespace-nowrap px-6">{item.text}</span>
          )}
          <span aria-hidden="true" className="text-primary-foreground/50">✦</span>
        </Fragment>
      ))}
    </div>
  );

  // Two identical halves; the track moves left by exactly one half, then loops seamlessly.
  const half = (halfKey: string, first: boolean) => (
    <div className="flex shrink-0">
      {Array.from({ length: repeat }, (_, copy) => (
        <Fragment key={`${halfKey}-${copy}`}>{renderItems(`${halfKey}-${copy}`, first && copy === 0)}</Fragment>
      ))}
    </div>
  );

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="group overflow-hidden bg-primary py-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-primary-foreground sm:text-[0.68rem] sm:tracking-[0.18em]"
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div
          className="flex w-max animate-[announcement-marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
        >
          {half("a", true)}
          {half("b", false)}
        </div>
      </div>
    </div>
  );
}
