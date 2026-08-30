"use client";

import { ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

type UploadedMedia = { id: string; url: string; altText?: string | null; width?: number | null; height?: number | null };
type PreparedImage = { file: File; width?: number; height?: number };
type Props = { enabled: boolean; fieldName?: string; label?: string; multiple?: boolean; defaultAltText?: string; maxFiles?: number };

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const maxUploadBytes = 6 * 1024 * 1024;
const maxInputBytes = 20 * 1024 * 1024;
const maxDimension = 2400;

async function prepareImage(file: File): Promise<PreparedImage> {
  if (!acceptedTypes.has(file.type) || file.size <= 0 || file.size > maxInputBytes) throw new Error(`${file.name} must be a supported image no larger than 20 MB.`);
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  if ((Math.max(bitmap.width, bitmap.height) <= maxDimension && file.size <= maxUploadBytes) || file.type === "image/gif") {
    bitmap.close();
    if (file.size > maxUploadBytes) throw new Error(`${file.name} is an animated GIF larger than 6 MB and cannot be optimized safely.`);
    return { file, ...dimensions };
  }
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error(`${file.name} could not be optimized in this browser.`);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob || blob.size > maxUploadBytes) throw new Error(`${file.name} could not be optimized below 6 MB.`);
  const stem = file.name.replace(/\.[^.]+$/, "") || "image";
  return { file: new File([blob], `${stem}.webp`, { type: "image/webp" }), width, height };
}

export function AdminMediaUploader({ enabled, fieldName, label = "Images", multiple = true, defaultAltText = "", maxFiles = multiple ? 6 : 1 }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState(defaultAltText);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  if (!enabled) return <p className="border border-dashed p-4 text-sm text-muted-foreground">Add the server-only Supabase secret key and public Supabase variables in Vercel to enable image uploads.</p>;

  async function upload(selected: File[]) {
    if (!selected.length || uploading) return;
    const files = selected.slice(0, Math.max(0, maxFiles - media.length));
    if (!files.length) return;
    setUploading(true);
    setMessage("Optimizing images…");
    try {
      const prepared = await Promise.all(files.map(prepareImage));
      const signResponse = await fetch("/api/admin/media", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "sign", files: prepared.map(({ file }) => ({ name: file.name, size: file.size, type: file.type })) }),
      });
      const signed = await signResponse.json() as { bucket?: string; error?: string; uploads?: { path: string; token: string }[] };
      if (!signResponse.ok || !signed.uploads) throw new Error(signed.error || "Upload authorization failed.");

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("The public Supabase upload variables are missing.");
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const bucket = signed.bucket;
      if (!bucket) throw new Error("The storage bucket is missing from the upload authorization.");
      setMessage("Uploading directly to image storage…");
      await Promise.all(signed.uploads.map(async (target, index) => {
        const source = prepared[index]!;
        const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(target.path, target.token, source.file, { cacheControl: "31536000", contentType: source.file.type });
        if (error) throw new Error(`Storage rejected ${source.file.name}: ${error.message}`);
      }));

      const completeResponse = await fetch("/api/admin/media", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "complete", files: signed.uploads.map((target, index) => ({
          path: target.path, originalName: prepared[index]!.file.name, mimeType: prepared[index]!.file.type,
          size: prepared[index]!.file.size, width: prepared[index]!.width, height: prepared[index]!.height,
          altText: altText.trim() || undefined,
        })) }),
      });
      const completed = await completeResponse.json() as { error?: string; media?: UploadedMedia[] };
      if (!completeResponse.ok || !completed.media) throw new Error(completed.error || "Upload finalization failed.");
      setMedia((current) => multiple ? [...current, ...completed.media!].slice(0, maxFiles) : completed.media!.slice(-1));
      setMessage(`${completed.media.length} image${completed.media.length === 1 ? "" : "s"} ready.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) { void upload(Array.from(event.target.files ?? [])); event.target.value = ""; }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)); }

  return <div className="space-y-3">
    <label className="grid gap-1 text-sm"><span>Alt text <span className="text-muted-foreground">(optional)</span></span><input className="h-10 border bg-background px-3" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={255} placeholder="Describe the image for accessibility" /></label>
    <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`border border-dashed p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : ""}`}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple={multiple} className="sr-only" onChange={onInputChange} />
      <ImageIcon className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
      <p className="mt-2 text-sm font-medium">Drag and drop {multiple ? `up to ${maxFiles} ${label.toLowerCase()}` : label.toLowerCase()}</p><p className="mt-1 text-xs text-muted-foreground">Large images are resized to 2400 px and optimized as WebP · 6 MB stored maximum</p>
      <button type="button" disabled={uploading || media.length >= maxFiles} onClick={() => inputRef.current?.click()} className="mt-4 border px-4 py-2 text-sm font-medium disabled:opacity-50">{uploading ? "Uploading…" : `Choose ${multiple ? "images" : "image"}`}</button>
      <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">{message}</p>
    </div>
    {media.length ? <ul className="grid gap-2 sm:grid-cols-2">{media.map((item) => <li key={item.id} className="flex min-w-0 items-center gap-3 border p-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.altText || "Uploaded image"}</p><p className="text-[.68rem] text-muted-foreground">{item.width && item.height ? `${item.width} × ${item.height}` : "Ready to use"}</p></div><button type="button" className="p-2" aria-label="Remove image from this form" onClick={() => setMedia((current) => current.filter((entry) => entry.id !== item.id))}><X className="size-4" /></button></li>)}</ul> : null}
    {fieldName ? media.map((item) => <input key={item.id} type="hidden" name={fieldName} value={item.url} />) : null}
  </div>;
}
