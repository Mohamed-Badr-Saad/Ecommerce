"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Banner = { id: string; title: string; subtitle: string | null; image: string; ctaText: string | null; ctaLink: string | null };

export function HomepageBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const banner = banners[index];
  if (!banner) return null;
  const showNavigation = banners.length > 1;
  const select = (next: number) => setIndex((next + banners.length) % banners.length);

  return (
    <section aria-roledescription="carousel" aria-label="Featured Talié banners" className="relative mx-auto min-h-[32rem] max-w-[1600px] overflow-hidden bg-primary sm:min-h-[38rem] lg:min-h-[calc(100svh-8rem)]">
      <Image key={banner.id} src={banner.image} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
      <div className="relative z-10 flex min-h-[32rem] items-end px-6 py-14 sm:min-h-[38rem] sm:px-10 lg:min-h-[calc(100svh-8rem)] lg:items-center lg:px-16 xl:px-24">
        <div className="max-w-2xl text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Talié edit</p>
          <h1 className="mt-5 font-heading text-5xl leading-[0.95] tracking-[-0.05em] text-balance sm:text-6xl xl:text-8xl">{banner.title}</h1>
          {banner.subtitle ? <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{banner.subtitle}</p> : null}
          {banner.ctaText && banner.ctaLink ? <Button asChild size="lg" className="mt-8 h-12 rounded-none bg-white px-7 text-primary hover:bg-white/85"><Link href={banner.ctaLink}>{banner.ctaText}</Link></Button> : null}
        </div>
      </div>
      {showNavigation ? <>
        <div className="absolute bottom-6 right-6 z-20 flex gap-2 sm:bottom-10 sm:right-10">
          <Button type="button" size="icon-lg" variant="outline" className="rounded-full border-white/40 bg-black/25 text-white hover:bg-black/50 hover:text-white" onClick={() => select(index - 1)} aria-label="Previous banner"><ChevronLeft /></Button>
          <Button type="button" size="icon-lg" variant="outline" className="rounded-full border-white/40 bg-black/25 text-white hover:bg-black/50 hover:text-white" onClick={() => select(index + 1)} aria-label="Next banner"><ChevronRight /></Button>
        </div>
        <p aria-live="polite" className="sr-only">Banner {index + 1} of {banners.length}</p>
      </> : null}
    </section>
  );
}
