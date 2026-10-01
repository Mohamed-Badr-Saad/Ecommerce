"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Crop, Minus, Monitor, Plus, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CropPresetName = "banner" | "product" | "feedback" | "free";

type AspectOption = { label: string; ratio: number | null };
type PreviewFrame = { label: string; device: "desktop" | "mobile"; ratio: number; fit: "cover" | "contain"; note: string };
type CropPreset = { aspects: AspectOption[]; previews: PreviewFrame[] };

/**
 * Preview frames mirror how the storefront actually renders each kind of image,
 * so the admin sees the real result before uploading.
 */
const PRESETS: Record<CropPresetName, CropPreset> = {
  banner: {
    aspects: [
      { label: "Wide 16:9", ratio: 16 / 9 },
      { label: "Extra wide 21:9", ratio: 21 / 9 },
      { label: "Portrait 4:5", ratio: 4 / 5 },
      { label: "Original", ratio: null },
    ],
    previews: [
      { label: "Homepage banner", device: "desktop", ratio: 1440 / 772, fit: "cover", note: "Laptop / desktop" },
      { label: "Homepage banner", device: "mobile", ratio: 375 / 512, fit: "cover", note: "Phone" },
    ],
  },
  product: {
    aspects: [
      { label: "Portrait 3:4", ratio: 3 / 4 },
      { label: "Square 1:1", ratio: 1 },
      { label: "Original", ratio: null },
    ],
    previews: [
      { label: "Product page", device: "desktop", ratio: 1, fit: "contain", note: "Laptop / desktop" },
      { label: "Product page", device: "mobile", ratio: 335 / 536, fit: "contain", note: "Phone" },
      { label: "Shop grid card", device: "mobile", ratio: 3 / 4, fit: "cover", note: "All screens" },
    ],
  },
  feedback: {
    aspects: [
      { label: "Original", ratio: null },
      { label: "Phone screenshot 9:16", ratio: 9 / 16 },
      { label: "Square 1:1", ratio: 1 },
    ],
    previews: [
      { label: "Homepage slider card", device: "desktop", ratio: 264 / 424, fit: "contain", note: "Laptop / desktop" },
      { label: "Homepage slider card", device: "mobile", ratio: 216 / 360, fit: "contain", note: "Phone" },
    ],
  },
  free: {
    aspects: [
      { label: "Original", ratio: null },
      { label: "Square 1:1", ratio: 1 },
      { label: "Portrait 3:4", ratio: 3 / 4 },
      { label: "Wide 16:9", ratio: 16 / 9 },
    ],
    previews: [],
  },
};

const MAX_ZOOM = 4;

type Props = {
  file: File;
  preset: CropPresetName;
  position?: { current: number; total: number };
  onConfirm: (file: File) => void;
  onUseOriginal: () => void;
  onCancel: () => void;
};

type Crop = { x: number; y: number; width: number; height: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Background-image styles that show `crop` of the source inside a frame, the way `object-fit` would. */
function framedStyle(src: string, natural: { width: number; height: number }, crop: Crop, frame: { width: number; height: number }, fit: "cover" | "contain") {
  const scale = fit === "cover" ? Math.max(frame.width / crop.width, frame.height / crop.height) : Math.min(frame.width / crop.width, frame.height / crop.height);
  const offsetX = (frame.width - crop.width * scale) / 2 - crop.x * scale;
  const offsetY = (frame.height - crop.height * scale) / 2 - crop.y * scale;
  return {
    backgroundImage: `url("${src}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${natural.width * scale}px ${natural.height * scale}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    // Hide the parts of the source outside the crop when the frame letterboxes it.
    clipPath: fit === "contain" ? `inset(${Math.max(0, (frame.height - crop.height * scale) / 2)}px ${Math.max(0, (frame.width - crop.width * scale) / 2)}px)` : undefined,
  } as const;
}

export function ImageCropDialog({ file, preset, position, onConfirm, onUseOriginal, onCancel }: Props) {
  const { aspects, previews } = PRESETS[preset];
  const [src, setSrc] = useState<string>();
  const [natural, setNatural] = useState<{ width: number; height: number }>();
  const [aspectIndex, setAspectIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<{ x: number; y: number }>();
  const [stageWidth, setStageWidth] = useState(480);
  const [saving, setSaving] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      setNatural({ width: image.naturalWidth, height: image.naturalHeight });
      setCenter({ x: image.naturalWidth / 2, y: image.naturalHeight / 2 });
      setSrc(url);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setStageWidth(entry.contentRect.width); });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; };
  }, [onCancel]);

  const ratio = aspects[aspectIndex]?.ratio ?? (natural ? natural.width / natural.height : 1);
  const frame = useMemo(() => {
    const maxHeight = 380;
    let width = Math.max(160, stageWidth);
    let height = width / ratio;
    if (height > maxHeight) { height = maxHeight; width = height * ratio; }
    return { width, height };
  }, [stageWidth, ratio]);

  const crop = useMemo<Crop | null>(() => {
    if (!natural || !center) return null;
    const scale = Math.max(frame.width / natural.width, frame.height / natural.height) * zoom;
    const width = frame.width / scale;
    const height = frame.height / scale;
    const x = clamp(center.x - width / 2, 0, natural.width - width);
    const y = clamp(center.y - height / 2, 0, natural.height - height);
    return { x, y, width, height };
  }, [natural, center, frame, zoom]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !crop || !natural) return;
    const unitsPerPixel = crop.width / frame.width;
    const dx = (event.clientX - drag.x) * unitsPerPixel;
    const dy = (event.clientY - drag.y) * unitsPerPixel;
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
    setCenter({
      x: clamp(crop.x + crop.width / 2 - dx, crop.width / 2, natural.width - crop.width / 2),
      y: clamp(crop.y + crop.height / 2 - dy, crop.height / 2, natural.height - crop.height / 2),
    });
  };
  const endDrag = () => { dragRef.current = null; };

  const changeAspect = (index: number) => {
    if (crop) setCenter({ x: crop.x + crop.width / 2, y: crop.y + crop.height / 2 });
    setAspectIndex(index);
  };
  const changeZoom = (next: number) => {
    if (crop) setCenter({ x: crop.x + crop.width / 2, y: crop.y + crop.height / 2 });
    setZoom(clamp(next, 1, MAX_ZOOM));
  };

  async function applyCrop() {
    if (!crop || !src) return;
    setSaving(true);
    try {
      const image = new window.Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(crop.width));
      canvas.height = Math.max(1, Math.round(crop.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser cannot crop images.");
      context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
      if (!blob) throw new Error("The cropped image could not be created.");
      const stem = file.name.replace(/\.[^.]+$/, "") || "image";
      onConfirm(new File([blob], `${stem}-cropped.webp`, { type: "image/webp" }));
    } finally {
      setSaving(false);
    }
  }

  const previewWidth = (item: PreviewFrame) => (item.device === "desktop" ? 260 : 130);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Crop image" className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:items-center sm:p-6">
      <div className="w-full max-w-5xl border border-border bg-card text-foreground shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-heading text-2xl"><Crop className="size-5 text-primary" aria-hidden="true" /> Crop &amp; preview</p>
            <p className="truncate text-xs text-muted-foreground">{position && position.total > 1 ? `Image ${position.current} of ${position.total} · ` : ""}{file.name}</p>
          </div>
          <button type="button" onClick={onCancel} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Cancel upload"><X className="size-5" /></button>
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div ref={stageRef} className="flex w-full justify-center bg-muted/60 p-0">
              {src && natural && crop ? (
                <div
                  className="relative cursor-grab touch-none select-none overflow-hidden bg-muted active:cursor-grabbing"
                  style={{ width: frame.width, height: frame.height, ...framedStyle(src, natural, crop, frame, "cover") }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onWheel={(event) => changeZoom(zoom - event.deltaY * 0.0015)}
                  role="img"
                  aria-label="Drag to choose the part of the image to keep"
                >
                  {/* Rule-of-thirds guide */}
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }, (_, cell) => <span key={cell} className="border border-white/25" />)}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground">Loading image…</div>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Drag the image to move it. Use the slider or your mouse wheel to zoom.</p>

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Shape">
              {aspects.map((option, index) => (
                <Button key={option.label} type="button" size="sm" variant={index === aspectIndex ? "default" : "outline"} className="rounded-none" onClick={() => changeAspect(index)} aria-pressed={index === aspectIndex}>{option.label}</Button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button type="button" className="p-1 text-muted-foreground hover:text-foreground" onClick={() => changeZoom(zoom - 0.25)} aria-label="Zoom out"><Minus className="size-4" /></button>
              <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} className="w-full accent-primary" aria-label="Zoom" />
              <button type="button" className="p-1 text-muted-foreground hover:text-foreground" onClick={() => changeZoom(zoom + 0.25)} aria-label="Zoom in"><Plus className="size-4" /></button>
            </div>
          </div>

          <div className="min-w-0">
            {previews.length ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">How it will look</p>
                <div className="mt-3 flex flex-wrap items-end gap-4">
                  {previews.map((item) => {
                    const width = previewWidth(item);
                    const box = { width, height: width / item.ratio };
                    return (
                      <figure key={`${item.label}-${item.device}`} className="min-w-0">
                        <div className={cn("overflow-hidden border border-border bg-muted", item.device === "mobile" ? "rounded-[14px] border-4 border-foreground/80" : "rounded-sm border-[3px] border-foreground/70")} style={{ width: box.width + (item.device === "mobile" ? 8 : 6) }}>
                          <div style={src && natural && crop ? { width: box.width, height: box.height, ...framedStyle(src, natural, crop, box, item.fit) } : { width: box.width, height: box.height }} />
                        </div>
                        <figcaption className="mt-1.5 flex items-center gap-1 text-xs">
                          {item.device === "mobile" ? <Smartphone className="size-3.5 text-muted-foreground" aria-hidden="true" /> : <Monitor className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                          <span className="font-medium">{item.label}</span>
                        </figcaption>
                        <p className="text-[0.68rem] text-muted-foreground">{item.note}</p>
                      </figure>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">Previews use the same framing as the website. Keep faces and important details away from the edges so they stay visible on every screen.</p>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">Choose a shape, then drag and zoom to keep the part you want. The image is saved exactly as shown in the frame.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">
          <Button type="button" variant="ghost" className="rounded-none" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="outline" className="rounded-none" onClick={onUseOriginal} disabled={saving}>Use without cropping</Button>
          <Button type="button" className="rounded-none" onClick={applyCrop} disabled={!crop || saving}>{saving ? "Cropping…" : "Crop & upload"}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
