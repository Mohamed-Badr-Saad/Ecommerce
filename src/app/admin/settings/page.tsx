import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoreProfile } from "@/lib/admin-operations";
import { saveStoreProfileAction } from "../operations-actions";

export const metadata = { title: "Settings | Admin" };

export default async function AdminSettingsPage() {
  const profile = await getStoreProfile();
  return <section><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Configuration</p><h2 className="mt-3 font-heading text-5xl">Settings</h2><p className="mt-3 text-muted-foreground">Store identity and customer support details.</p><Card className="mt-8 max-w-3xl rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">Store profile</CardTitle></CardHeader><CardContent><form action={saveStoreProfileAction} className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="store-name">Store name</Label><Input id="store-name" name="storeName" defaultValue={profile.storeName} required /></div><div><Label htmlFor="currency">Currency</Label><Input id="currency" name="currency" defaultValue="EGP" readOnly /></div><div className="sm:col-span-2"><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" defaultValue={profile.tagline} required /></div><div><Label htmlFor="support-email">Support email</Label><Input id="support-email" name="supportEmail" type="email" defaultValue={profile.supportEmail} required /></div><div><Label htmlFor="support-phone">Support phone</Label><Input id="support-phone" name="supportPhone" defaultValue={profile.supportPhone} required /></div><Button className="rounded-none sm:col-span-2">Save settings</Button></form></CardContent></Card></section>;
}
