"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

export function AdminMediaUploader({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  if (!enabled) return <p className="border border-dashed p-4 text-sm text-muted-foreground">Add the server-only Supabase secret key to enable image uploads. Existing and local image URLs can still be assigned to products and banners.</p>;

  async function upload(files: File[]) {
    if (!files.length || uploading) return;
    setUploading(true);
    setMessage("Uploading…");
    const body = new FormData();
    files.slice(0, 6).forEach((file) => body.append("files", file));
    body.set("altText", altText);
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = (await response.json()) as { error?: string; media?: unknown[] };
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setMessage(`${result.media?.length ?? files.length} image${files.length === 1 ? "" : "s"} uploaded.`);
      setAltText("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    void upload(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void upload(Array.from(event.dataTransfer.files));
  }

  return <div className="space-y-3">
    <label className="grid gap-1 text-sm"><span>Alt text <span className="text-muted-foreground">(optional; defaults to the filename)</span></span><input className="h-10 border bg-background px-3" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={255} placeholder="Product title or a short image description" /></label>
    <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`border border-dashed p-8 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : ""}`}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple className="sr-only" onChange={onInputChange} />
      <p className="text-sm font-medium">Drag and drop up to six product images</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, GIF, or AVIF · 6 MB maximum each</p>
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="mt-4 border px-4 py-2 text-sm font-medium disabled:opacity-50">{uploading ? "Uploading…" : "Choose images"}</button>
      <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">{message}</p>
    </div>
  </div>;
}
