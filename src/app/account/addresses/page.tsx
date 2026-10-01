import { Check, MapPin, Trash2 } from "lucide-react";

import { createAddressAction, deleteAddressAction, setDefaultAddressAction } from "@/app/account/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const fields = [
  ["label", "Label", "Home"], ["firstName", "First name", ""], ["lastName", "Last name", ""],
  ["street", "Street address", ""], ["apartment", "Apartment / floor", ""], ["city", "City", ""],
  ["governorate", "Governorate", ""], ["postalCode", "Postal code", ""], ["phone", "Phone", ""],
] as const;

export const metadata = { title: "Addresses" };

export default async function AddressesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [session, params] = await Promise.all([requireSession(), searchParams]);
  const addresses = await prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return <section><h2 className="font-heading text-4xl">Saved addresses</h2><p className="mt-2 text-muted-foreground">Store delivery details securely for future orders.</p>{addresses.length ? <div className="mt-8 grid gap-4 md:grid-cols-2">{addresses.map((address) => <Card key={address.id} className="rounded-none"><CardHeader><div className="flex items-center justify-between gap-4"><MapPin className="size-5 text-primary" />{address.isDefault ? <Badge className="rounded-none">Default</Badge> : null}</div><CardTitle className="mt-3 text-2xl">{address.label || `${address.firstName} ${address.lastName}`}</CardTitle></CardHeader><CardContent className="space-y-1 leading-6 text-muted-foreground"><p>{address.firstName} {address.lastName}</p><p>{address.street}{address.apartment ? `, ${address.apartment}` : ""}</p><p>{address.city}, {address.governorate}</p><p>{address.phone}</p><div className="flex flex-wrap gap-2 pt-4">{!address.isDefault ? <form action={setDefaultAddressAction.bind(null, address.id)}><Button type="submit" variant="outline" size="sm" className="rounded-none"><Check /> Make default</Button></form> : null}<form action={deleteAddressAction.bind(null, address.id)}><Button type="submit" variant="destructive" size="sm" className="rounded-none"><Trash2 /> Remove</Button></form></div></CardContent></Card>)}</div> : <div className="mt-8 border border-border bg-card p-8 text-center"><MapPin className="mx-auto size-7 text-primary" /><p className="mt-3 font-heading text-2xl">No saved addresses yet</p></div>}
    <Card className="mt-10 rounded-none"><CardHeader><CardTitle className="text-2xl">Add an address</CardTitle></CardHeader><CardContent><form action={createAddressAction} className="grid gap-5 sm:grid-cols-2">{fields.map(([name, label, placeholder]) => <div key={name} className={`space-y-2 ${name === "street" ? "sm:col-span-2" : ""}`}><Label htmlFor={`address-${name}`}>{label}</Label><Input id={`address-${name}`} name={name} placeholder={placeholder} required={["firstName","lastName","street","city","governorate","phone"].includes(name)} className="h-11 rounded-none" /></div>)}<Label htmlFor="address-default" className="sm:col-span-2"><Checkbox id="address-default" name="isDefault" /> Use as default address</Label>{params.saved ? <p role="status" className="text-sm text-primary sm:col-span-2">Address saved.</p> : null}<Button type="submit" className="h-11 rounded-none sm:col-span-2 sm:w-fit">Save address</Button></form></CardContent></Card>
  </section>;
}
