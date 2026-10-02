"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Banner = { id: string; title: string; subtitle: string | null; image: string; ctaText: string | null; ctaLink: string | null };

const AUTOPLAY_MS = 6000;

/**
 * Homepage hero. Banners cross-fade automatically every few seconds; the arrows and dots
 * still work, and hovering or focusing the banner pauses it so a visitor can read it.
 */
export function HomepageBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, index]);

  if (!count) return null;
  const active = index % count;
  const showNavigation = count > 1;
  const select = (next: number) => setIndex((next + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured Talié banners"
      className="relative mx-auto grid min-h-[32rem] max-w-[1600px] overflow-hidden bg-primary sm:min-h-[38rem] lg:min-h-[calc(100svh-8rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {banners.map((banner, position) => {
        const visible = position === active;
        return (
          <div
            key={banner.id}
            aria-hidden={!visible}
            inert={!visible || undefined}
            className={cn(
              "col-start-1 row-start-1 relative transition-opacity duration-1000 ease-in-out",
              visible ? "z-10 opacity-100" : "z-0 opacity-0",
            )}
          >
            <Image src={banner.image} alt="" fill priority={position === 0} sizes="100vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
            <div className="relative z-10 flex h-full min-h-[32rem] items-end px-6 pb-24 pt-14 sm:min-h-[38rem] sm:px-10 lg:min-h-[calc(100svh-8rem)] lg:items-center lg:px-16 lg:pb-14 xl:px-24">
              <div className="max-w-2xl text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">New at Talié</p>
                {position === 0 ? (
                  <h1 className="mt-5 font-heading text-5xl leading-[0.95] tracking-[-0.05em] text-balance sm:text-6xl xl:text-8xl">{banner.title}</h1>
                ) : (
                  <h2 className="mt-5 font-heading text-5xl leading-[0.95] tracking-[-0.05em] text-balance sm:text-6xl xl:text-8xl">{banner.title}</h2>
                )}
                {banner.subtitle ? <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{banner.subtitle}</p> : null}
                {banner.ctaText && banner.ctaLink ? <Button asChild size="lg" className="mt-8 h-12 rounded-none bg-white px-7 text-primary hover:bg-white/85"><Link href={banner.ctaLink}>{banner.ctaText}</Link></Button> : null}
              </div>
            </div>
          </div>
        );
      })}

      {showNavigation ? <>
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 sm:bottom-10 sm:left-10 lg:left-16 xl:left-24">
          {banners.map((banner, position) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => select(position)}
              aria-label={`Show banner ${position + 1}`}
              aria-current={position === active ? "true" : undefined}
              className={cn("h-1.5 rounded-full transition-all", position === active ? "w-8 bg-white" : "w-3 bg-white/45 hover:bg-white/70")}
            />
          ))}
        </div>
        {/* Kept clear of the social media icons pinned to the bottom-right corner. */}
        <div className="absolute bottom-6 right-20 z-20 flex gap-2 sm:bottom-10 sm:right-24">
          <Button type="button" size="icon-lg" variant="outline" className="rounded-full border-white/40 bg-black/25 text-white hover:bg-black/50 hover:text-white" onClick={() => select(active - 1)} aria-label="Previous banner"><ChevronLeft /></Button>
          <Button type="button" size="icon-lg" variant="outline" className="rounded-full border-white/40 bg-black/25 text-white hover:bg-black/50 hover:text-white" onClick={() => select(active + 1)} aria-label="Next banner"><ChevronRight /></Button>
        </div>
        <p aria-live="polite" className="sr-only">Banner {active + 1} of {count}</p>
      </> : null}
    </section>
  );
}
