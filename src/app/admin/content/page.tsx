import { AdminMediaUploader } from "@/components/admin-media-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAdminContent } from "@/lib/admin-content";
import { isSupabaseStorageConfigured } from "@/lib/supabase-admin";
import { createBannerAction, toggleBannerAction, updatePolicyAction } from "./actions";

export const metadata = { title: "Content | Admin" };

export default async function AdminContentPage() {
  const { media, banners, policies } = await getAdminContent();
  return <section><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Storefront publishing</p><h2 className="mt-3 font-heading text-5xl">Content</h2><p className="mt-3 text-muted-foreground">Upload approved imagery and maintain banners and policy copy.</p>
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Media library</CardTitle></CardHeader><CardContent><AdminMediaUploader enabled={isSupabaseStorageConfigured()} /><ul className="mt-5 grid gap-2 sm:grid-cols-2">{media.map((item) => <li key={item.id} className="min-w-0 border p-3"><p className="truncate text-sm font-medium">{item.originalName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.altText}</p><p className="mt-1 text-xs text-muted-foreground">{item.mimeType} · {(item.size / 1024).toFixed(0)} KB</p></li>)}</ul>{!media.length ? <p className="mt-5 text-center text-sm text-muted-foreground">No uploaded media yet.</p> : null}</CardContent></Card>
      <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Banners</CardTitle></CardHeader><CardContent><form action={createBannerAction} className="grid gap-3 sm:grid-cols-2"><Input name="title" placeholder="Title" required /><Input name="subtitle" placeholder="Subtitle" /><Input name="image" placeholder="Image URL" className="sm:col-span-2" required /><Input name="ctaText" placeholder="Button label" /><Input name="ctaLink" placeholder="/shop" /><Input name="displayOrder" type="number" min="0" defaultValue="0" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" /> Active</label><Button className="rounded-none sm:col-span-2">Create banner</Button></form><ul className="mt-5 divide-y">{banners.map((banner) => <li key={banner.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{banner.title}</p><Badge variant="outline" className="mt-1 rounded-none">{banner.isActive ? "active" : "inactive"}</Badge></div><form action={toggleBannerAction.bind(null, banner.id)}><Button variant="outline" size="sm" className="rounded-none">{banner.isActive ? "Disable" : "Enable"}</Button></form></li>)}</ul></CardContent></Card>
    </div>
    <Card className="mt-6 rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Policy content</CardTitle></CardHeader><CardContent><div className="grid gap-5 lg:grid-cols-2">{policies.map((policy) => <form key={policy.id} action={updatePolicyAction.bind(null, policy.id)} className="grid gap-3 border p-4"><div><Label htmlFor={`title-${policy.id}`}>{policy.type.toLowerCase()}</Label><Input id={`title-${policy.id}`} name="title" defaultValue={policy.title} required /></div><Textarea name="content" defaultValue={policy.content} rows={7} minLength={20} required /><Button variant="outline" className="rounded-none">Save policy</Button></form>)}</div></CardContent></Card>
  </section>;
}
