"use client";

import { useActionState, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { saveShippingSettingsAction, type ShippingFormState } from "@/app/admin/operations-actions";
import { EGYPTIAN_GOVERNORATES, type ShippingSettings } from "@/lib/commerce";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

/** Admin → Settings → Delivery: free-delivery amount and the fee for each governorate. */
export function AdminShippingForm({ settings }: { settings: ShippingSettings }) {
  const [state, action, pending] = useActionState<ShippingFormState, FormData>(saveShippingSettingsAction, {});
  const [freeEnabled, setFreeEnabled] = useState(settings.freeShippingThreshold !== null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fillValue, setFillValue] = useState("");

  const fillAll = () => {
    if (fillValue.trim() === "" || !formRef.current) return;
    for (const name of EGYPTIAN_GOVERNORATES) {
      const input = formRef.current.elements.namedItem(`rate:${name}`);
      if (input instanceof HTMLInputElement) input.value = fillValue.trim();
    }
  };

  return (
    <form ref={formRef} action={action} className="grid gap-8">
      <fieldset className="grid gap-4">
        <legend className="text-base font-medium">Free delivery</legend>
        <div className="flex items-start gap-3">
          <Checkbox id="free-shipping-enabled" name="freeShippingEnabled" checked={freeEnabled} onCheckedChange={(value) => setFreeEnabled(value === true)} className="mt-0.5" />
          <Label htmlFor="free-shipping-enabled" className="block font-normal leading-5">
            <span className="block font-medium">Offer free delivery on bigger orders</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Delivery becomes free when the order total (after discounts) reaches this amount.</span>
          </Label>
        </div>
        <div className="grid max-w-xs gap-1.5">
          <Label htmlFor="free-shipping-threshold">Free delivery from (EGP)</Label>
          <Input
            id="free-shipping-threshold"
            name="freeShippingThreshold"
            type="number"
            inputMode="numeric"
            min={1}
            step="any"
            defaultValue={settings.freeShippingThreshold ?? 2500}
            disabled={!freeEnabled}
            required={freeEnabled}
            className="h-11 rounded-none"
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="text-base font-medium">Delivery fee by governorate (EGP)</legend>
        <div className="flex flex-wrap items-end gap-2 border border-dashed border-border p-3">
          <div className="grid gap-1.5">
            <Label htmlFor="fill-all-fees" className="text-xs text-muted-foreground">Quick fill: set every fee to</Label>
            <Input id="fill-all-fees" type="number" inputMode="numeric" min={0} step="any" value={fillValue} onChange={(event) => setFillValue(event.target.value)} className="h-10 w-32 rounded-none" />
          </div>
          <Button type="button" variant="outline" className="h-10 rounded-none" onClick={fillAll} disabled={fillValue.trim() === ""}>Apply to all</Button>
          <p className="basis-full text-xs text-muted-foreground">Then adjust individual governorates and save.</p>
        </div>
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {EGYPTIAN_GOVERNORATES.map((name) => (
            <div key={name} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3">
              <Label htmlFor={`rate-${name}`} className="font-normal">{name}</Label>
              <Input id={`rate-${name}`} name={`rate:${name}`} type="number" inputMode="numeric" min={0} step="any" defaultValue={settings.rates[name]} required className="h-10 rounded-none" />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Use 0 to deliver free to a governorate. New fees apply to new orders right away; existing orders keep the fee they were placed with.</p>
      </fieldset>

      {state.error ? <p role="alert" className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      {state.saved ? <p role="status" className="border border-primary/25 bg-card p-3 text-sm">Delivery settings saved. If your announcement bar mentions the free-delivery amount, update that message in Content.</p> : null}
      <Button type="submit" disabled={pending} className="h-11 w-fit rounded-none">{pending ? <LoaderCircle className="animate-spin" /> : null}Save delivery settings</Button>
    </form>
  );
}
