import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminDiscountCodes } from "@/lib/discount-codes";
import { describeDiscount, discountStatus } from "@/lib/discounts";
import { formatEgp } from "@/lib/storefront";
import { createDiscountCodeAction, deleteDiscountCodeAction, toggleDiscountCodeAction, updateDiscountCodeAction } from "./actions";

export const metadata = { title: "Discounts | Admin" };

function dateTimeValue(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

type Defaults = Awaited<ReturnType<typeof getAdminDiscountCodes>>[number] | null;

function DiscountFields({ discount, idPrefix }: { discount: Defaults; idPrefix: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const num = (value: { toString(): string } | null | undefined) => value == null ? "" : String(value);
  return <>
    <div className="grid gap-1.5"><Label htmlFor={id("code")}>Code</Label><Input id={id("code")} name="code" defaultValue={discount?.code} required minLength={3} maxLength={32} pattern="[A-Za-z0-9_\-]{3,32}" placeholder="e.g. WELCOME10" className="uppercase" /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("description")}>Internal note</Label><Input id={id("description")} name="description" defaultValue={discount?.description ?? ""} maxLength={200} placeholder="e.g. Instagram launch campaign" /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("type")}>Type</Label><select id={id("type")} name="type" defaultValue={discount?.type ?? "PERCENTAGE"} className="h-9 w-full border border-input bg-transparent px-3 text-sm"><option value="PERCENTAGE">Percentage off</option><option value="FIXED_AMOUNT">Fixed amount off (EGP)</option></select></div>
    <div className="grid gap-1.5"><Label htmlFor={id("value")}>Value</Label><Input id={id("value")} name="value" type="number" min="0.01" step="0.01" defaultValue={num(discount?.value)} required placeholder="e.g. 10" /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("minSubtotal")}>Minimum spend (EGP, optional)</Label><Input id={id("minSubtotal")} name="minSubtotal" type="number" min="0.01" step="0.01" defaultValue={num(discount?.minSubtotal)} /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("maxDiscount")}>Max discount for % codes (EGP, optional)</Label><Input id={id("maxDiscount")} name="maxDiscount" type="number" min="0.01" step="0.01" defaultValue={num(discount?.maxDiscount)} /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("usageLimit")}>Total uses (optional)</Label><Input id={id("usageLimit")} name="usageLimit" type="number" min="1" step="1" defaultValue={num(discount?.usageLimit)} /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("perCustomerLimit")}>Uses per customer (optional)</Label><Input id={id("perCustomerLimit")} name="perCustomerLimit" type="number" min="1" step="1" defaultValue={num(discount?.perCustomerLimit)} /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("startsAt")}>Starts (optional)</Label><Input id={id("startsAt")} name="startsAt" type="datetime-local" defaultValue={dateTimeValue(discount?.startsAt ?? null)} /></div>
    <div className="grid gap-1.5"><Label htmlFor={id("endsAt")}>Ends (optional)</Label><Input id={id("endsAt")} name="endsAt" type="datetime-local" defaultValue={dateTimeValue(discount?.endsAt ?? null)} /></div>
    <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked={discount?.isActive ?? true} /> Active — customers can apply this code</label>
  </>;
}

export default async function AdminDiscountsPage() {
  const discounts = await getAdminDiscountCodes();
  const now = new Date();
  return <section>
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">Promotions</p>
    <h2 className="mt-3 font-heading text-5xl">Discount codes</h2>
    <p className="mt-3 max-w-3xl text-muted-foreground">Create codes customers type in their bag to get money off. Codes apply to the items (after any sale price), not to delivery. Cancelled or unpaid online orders don’t count as a use.</p>
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,26rem)_1fr]">
      <Card className="h-fit rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">New code</CardTitle></CardHeader><CardContent>
        <form action={createDiscountCodeAction} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <DiscountFields discount={null} idPrefix="new" />
          <Button className="rounded-none sm:col-span-2 xl:col-span-1">Create code</Button>
        </form>
      </CardContent></Card>
      <Card className="rounded-none"><CardHeader><CardTitle className="font-heading text-3xl">All codes</CardTitle></CardHeader><CardContent>
        {discounts.length ? <div className="space-y-4">{discounts.map((discount) => {
          const status = discountStatus(discount.rule, discount.uses, now);
          return <details key={discount.id} className="border">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-4">
              <span className="min-w-0">
                <span className="block font-mono text-base font-semibold tracking-wide">{discount.code}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{describeDiscount(discount.rule)}{discount.rule.minSubtotal ? ` · min. ${formatEgp(discount.rule.minSubtotal)}` : ""}{discount.description ? ` · ${discount.description}` : ""}</span>
              </span>
              <span className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant={status === "active" ? "secondary" : "outline"} className="rounded-none capitalize">{status}</Badge>
                <span className="text-muted-foreground">{discount.uses}{discount.usageLimit ? ` / ${discount.usageLimit}` : ""} uses · {formatEgp(discount.totalDiscounted)} given</span>
                <span className="text-muted-foreground underline-offset-4 hover:underline">Edit</span>
              </span>
            </summary>
            <div className="border-t p-4">
              <form action={updateDiscountCodeAction.bind(null, discount.id)} className="grid gap-3 sm:grid-cols-2">
                <DiscountFields discount={discount} idPrefix={discount.id} />
                <Button className="rounded-none sm:col-span-2">Save code</Button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={toggleDiscountCodeAction.bind(null, discount.id)}><Button variant="outline" size="sm" className="rounded-none">{discount.isActive ? "Deactivate" : "Activate"}</Button></form>
                {discount._count.orders === 0 ? <form action={deleteDiscountCodeAction.bind(null, discount.id)}><ConfirmSubmitButton message={`Delete discount code ${discount.code}? Bags that applied it will lose it.`}>Delete</ConfirmSubmitButton></form> : <p className="self-center text-xs text-muted-foreground">Used codes can be deactivated but not deleted.</p>}
              </div>
            </div>
          </details>;
        })}</div> : <p className="py-10 text-center text-sm text-muted-foreground">No discount codes yet. Create your first one to start a promotion.</p>}
      </CardContent></Card>
    </div>
  </section>;
}
