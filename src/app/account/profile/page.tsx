import { updateProfileAction } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSession } from "@/lib/session";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  return <section><h2 className="font-heading text-4xl">Profile details</h2><p className="mt-2 text-muted-foreground">Keep your contact details current for a smoother checkout.</p><Card className="mt-8 max-w-2xl rounded-none"><CardHeader><CardTitle className="text-2xl">Personal information</CardTitle><CardDescription>Your email is managed by your sign-in account.</CardDescription></CardHeader><CardContent><form action={updateProfileAction} className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" name="name" defaultValue={session.user.name} required minLength={2} className="h-11 rounded-none" /></div><div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={session.user.email} disabled className="h-11 rounded-none" /></div><div className="space-y-2"><Label htmlFor="profile-phone">Phone</Label><Input id="profile-phone" name="phone" defaultValue={session.user.phone ?? ""} type="tel" className="h-11 rounded-none" /></div>{params.saved ? <p role="status" className="text-sm text-primary sm:col-span-2">Profile updated.</p> : null}<Button type="submit" className="h-11 rounded-none sm:col-span-2 sm:w-fit">Save changes</Button></form></CardContent></Card></section>;
}
