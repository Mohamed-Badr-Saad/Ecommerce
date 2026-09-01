"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";

import { Button } from "@/components/ui/button";

type GalleryImage = { id: string; url: string; altText: string };

export function ProductImageGallery({ images, productTitle }: { images: GalleryImage[]; productTitle: string }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const image = images[index];
  if (!image) return null;
  const select = (next: number) => setIndex((next + images.length) % images.length);
  const onTouchStart = (event: TouchEvent) => { touchStart.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const end = event.changedTouches[0]?.clientX;
    touchStart.current = null;
    if (start == null || end == null || Math.abs(end - start) < 45) return;
    select(index + (end < start ? 1 : -1));
  };

  return (
    <section aria-label={`${productTitle} images`} aria-roledescription="carousel" className="min-w-0">
      <div className="relative h-[min(66svh,42rem)] min-h-72 overflow-hidden bg-muted sm:h-[min(72svh,46rem)] lg:h-[min(78svh,48rem)]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Image key={image.id} src={image.url} alt={image.altText} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-contain" />
        {images.length > 1 ? <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
          <Button type="button" size="icon-lg" variant="outline" className="rounded-full border-white/60 bg-white/85 shadow-sm" onClick={() => select(index - 1)} aria-label="Previous product image"><ChevronLeft /></Button>
          <Button type="button" size="icon-lg" variant="outline" className="rounded-full border-white/60 bg-white/85 shadow-sm" onClick={() => select(index + 1)} aria-label="Next product image"><ChevronRight /></Button>
        </div> : null}
        <p className="absolute bottom-3 right-3 bg-black/65 px-2.5 py-1 text-xs text-white">{index + 1} / {images.length}</p>
      </div>
      {images.length > 1 ? <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-2" role="group" aria-label="Choose product image">
        {images.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} aria-label={`Show image ${itemIndex + 1}`} aria-current={itemIndex === index ? "true" : undefined} className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden border-2 bg-muted ${itemIndex === index ? "border-primary" : "border-transparent opacity-65 hover:opacity-100"}`}><Image src={item.url} alt="" fill sizes="80px" className="object-contain" /></button>)}
      </div> : null}
      <p aria-live="polite" className="sr-only">Showing image {index + 1} of {images.length}</p>
    </section>
  );
}
