import Image from "next/image";

import { AdminMediaUploader } from "@/components/admin-media-uploader";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminContent } from "@/lib/admin-content";
import { isSupabaseStorageConfigured } from "@/lib/supabase-admin";
import { createBannerAction, deleteBannerAction, deleteMediaAction, toggleBannerAction, updateBannerAction, updateMediaAction, updatePolicyAction } from "./actions";

export const metadata = { title: "Content | Admin" };

function dateTimeValue(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function AdminContentPage() {
  const { media, banners, policies } = await getAdminContent();
  const uploadsEnabled = isSupabaseStorageConfigured();
  return <section>
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Storefront publishing</p>
    <h2 className="mt-3 font-heading text-5xl">Content</h2>
    <p className="mt-3 text-muted-foreground">Upload approved imagery and maintain the homepage hero, banners, and policy copy.</p>
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Media library</CardTitle></CardHeader><CardContent>
        <AdminMediaUploader enabled={uploadsEnabled} label="media images" />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">{media.map((item) => <li key={item.id} className="min-w-0 border p-3"><div className="relative mb-3 aspect-square overflow-hidden bg-muted"><Image src={item.url} alt="" fill sizes="(min-width: 1280px) 20vw, 50vw" className="object-cover" /></div><p className="truncate text-sm font-medium">{item.originalName}</p><p className="mt-1 text-xs text-muted-foreground">{item.mimeType} · {(item.size / 1024).toFixed(0)} KB{item.width && item.height ? ` · ${item.width} × ${item.height}` : ""}</p><form action={updateMediaAction.bind(null, item.id)} className="mt-3 grid gap-2"><Input name="altText" defaultValue={item.altText ?? ""} aria-label="Media alt text" required maxLength={255} /><Button variant="outline" size="sm" className="rounded-none">Save alt text</Button></form><form action={deleteMediaAction.bind(null, item.id)} className="mt-2"><ConfirmSubmitButton message="Permanently delete this unused media file from Supabase Storage?">Delete media</ConfirmSubmitButton></form></li>)}</ul>
        {!media.length ? <p className="mt-5 text-center text-sm text-muted-foreground">No uploaded media yet.</p> : null}
      </CardContent></Card>
      <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Homepage banners</CardTitle></CardHeader><CardContent>
        <p className="mb-5 text-sm leading-6 text-muted-foreground">Active banners appear as the main homepage hero. Use a landscape image—ideally 1920 × 1080 or wider. The storefront crops it responsively around the center. Leave both dates empty to publish immediately and indefinitely.</p>
        <form action={createBannerAction} className="grid gap-3 sm:grid-cols-2">
          <Input name="title" placeholder="Title" required /><Input name="subtitle" placeholder="Subtitle" />
          <div className="sm:col-span-2"><AdminMediaUploader enabled={uploadsEnabled} fieldName="image" label="banner image" multiple={false} /></div>
          <Input name="ctaText" placeholder="Button label" /><Input name="ctaLink" placeholder="/shop" />
          <div><Label htmlFor="banner-start">Starts (optional)</Label><Input id="banner-start" name="startDate" type="datetime-local" /></div>
          <div><Label htmlFor="banner-end">Ends (optional)</Label><Input id="banner-end" name="endDate" type="datetime-local" /></div>
          <div><Label htmlFor="banner-order">Display order</Label><Input id="banner-order" name="displayOrder" type="number" min="0" defaultValue="0" /></div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isActive" /> Active on homepage</label>
          <Button className="rounded-none sm:col-span-2">Create banner</Button>
        </form>
        <div className="mt-7 space-y-4">{banners.map((banner) => <details key={banner.id} className="border" open={banners.length === 1}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4"><span className="min-w-0"><span className="block truncate font-medium">{banner.title}</span><span className="mt-1 flex flex-wrap gap-2"><Badge variant="outline" className="rounded-none">{banner.isActive ? "active" : "inactive"}</Badge><span className="text-xs text-muted-foreground">order {banner.displayOrder}</span></span></span><span className="text-sm text-muted-foreground">Edit</span></summary>
          <div className="border-t p-4">
            <div className="relative mb-4 aspect-video overflow-hidden bg-muted"><Image src={banner.image} alt="" fill sizes="(min-width: 1280px) 40vw, 100vw" className="object-cover" /></div>
            <form action={updateBannerAction.bind(null, banner.id)} className="grid gap-3 sm:grid-cols-2">
              <Input name="title" defaultValue={banner.title} aria-label="Banner title" required /><Input name="subtitle" defaultValue={banner.subtitle ?? ""} aria-label="Banner subtitle" placeholder="Subtitle" />
              <input type="hidden" name="image" value={banner.image} /><div className="sm:col-span-2"><AdminMediaUploader enabled={uploadsEnabled} fieldName="image" label="replacement banner image" multiple={false} /></div>
              <Input name="ctaText" defaultValue={banner.ctaText ?? ""} aria-label="Button label" placeholder="Button label" /><Input name="ctaLink" defaultValue={banner.ctaLink ?? ""} aria-label="Button link" placeholder="/shop" />
              <div><Label htmlFor={`start-${banner.id}`}>Starts</Label><Input id={`start-${banner.id}`} name="startDate" type="datetime-local" defaultValue={dateTimeValue(banner.startDate)} /></div>
              <div><Label htmlFor={`end-${banner.id}`}>Ends</Label><Input id={`end-${banner.id}`} name="endDate" type="datetime-local" defaultValue={dateTimeValue(banner.endDate)} /></div>
              <div><Label htmlFor={`order-${banner.id}`}>Display order</Label><Input id={`order-${banner.id}`} name="displayOrder" type="number" min="0" defaultValue={banner.displayOrder} /></div>
              <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={banner.isActive} /> Active on homepage</label>
              <Button className="rounded-none sm:col-span-2">Save banner</Button>
            </form>
            <div className="mt-3 flex flex-wrap justify-between gap-2"><form action={toggleBannerAction.bind(null, banner.id)}><Button variant="outline" size="sm" className="rounded-none">{banner.isActive ? "Disable" : "Enable"}</Button></form><form action={deleteBannerAction.bind(null, banner.id)}><ConfirmSubmitButton message={`Delete “${banner.title}”? This removes the banner record, but keeps its uploaded image in the media library.`}>Delete banner</ConfirmSubmitButton></form></div>
          </div>
        </details>)}</div>
        {!banners.length ? <p className="mt-6 text-center text-sm text-muted-foreground">No banners yet. The default Talié hero is currently shown.</p> : null}
      </CardContent></Card>
    </div>
    <Card className="mt-6 rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Policy content</CardTitle></CardHeader><CardContent><div className="grid gap-5 lg:grid-cols-2">{policies.map((policy) => <form key={policy.id} action={updatePolicyAction.bind(null, policy.id)} className="grid gap-3 border p-4"><div><Label htmlFor={`title-${policy.id}`}>{policy.type.toLowerCase()}</Label><Input id={`title-${policy.id}`} name="title" defaultValue={policy.title} required /></div><Textarea name="content" defaultValue={policy.content} rows={7} minLength={20} required /><Button variant="outline" className="rounded-none">Save policy</Button></form>)}</div></CardContent></Card>
  </section>;
}
