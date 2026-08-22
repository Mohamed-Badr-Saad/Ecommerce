"use client";

import { useActionState, useState } from "react";
import { Banknote, CreditCard, LoaderCircle, LockKeyhole } from "lucide-react";

import { placeOrderAction } from "@/app/checkout/actions";
import { EGYPTIAN_GOVERNORATES, calculateShipping } from "@/lib/commerce";
import { formatEgp } from "@/lib/storefront";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

type Defaults = Partial<Record<"firstName" | "lastName" | "email" | "phone" | "street" | "apartment" | "city" | "governorate" | "postalCode", string>>;

export function CheckoutForm({ subtotal, defaults = {} }: { subtotal: number; defaults?: Defaults }) {
  const [state, action, pending] = useActionState(placeOrderAction, {});
  const [governorate, setGovernorate] = useState(defaults.governorate ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"PAYMOB" | "COD">("PAYMOB");
  const field = (name: keyof Defaults, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`checkout-${name}`}>{label}</Label>
      <Input id={`checkout-${name}`} name={name} defaultValue={defaults[name]} className="h-12 rounded-none bg-card" aria-invalid={Boolean(state.fieldErrors?.[name])} {...props} />
      {state.fieldErrors?.[name]?.[0] ? <p className="text-xs text-destructive">{state.fieldErrors[name][0]}</p> : null}
    </div>
  );
  const estimatedShipping = governorate ? calculateShipping(subtotal, governorate) : null;

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Delivery details</p>
        <h1 className="mt-3 font-heading text-5xl tracking-[-0.04em]">Checkout</h1>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {field("firstName", "First name", { required: true, autoComplete: "given-name" })}
          {field("lastName", "Last name", { required: true, autoComplete: "family-name" })}
          {field("email", "Email address", { required: true, type: "email", autoComplete: "email" })}
          {field("phone", "Mobile number", { required: true, type: "tel", autoComplete: "tel", placeholder: "01XXXXXXXXX" })}
          <div className="sm:col-span-2">{field("street", "Street address", { required: true, autoComplete: "street-address" })}</div>
          {field("apartment", "Apartment / floor")}
          {field("city", "City / area", { required: true, autoComplete: "address-level2" })}
          <div className="space-y-2">
            <Label htmlFor="checkout-governorate">Governorate</Label>
            <Select name="governorate" defaultValue={defaults.governorate} onValueChange={setGovernorate} required>
              <SelectTrigger id="checkout-governorate" className="h-12 w-full rounded-none bg-card"><SelectValue placeholder="Choose governorate" /></SelectTrigger>
              <SelectContent>{EGYPTIAN_GOVERNORATES.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
            </Select>
            {state.fieldErrors?.governorate?.[0] ? <p className="text-xs text-destructive">{state.fieldErrors.governorate[0]}</p> : null}
          </div>
          {field("postalCode", "Postal code", { autoComplete: "postal-code" })}
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="checkout-notes">Order notes</Label><Textarea id="checkout-notes" name="notes" className="min-h-28 rounded-none bg-card" /></div>
        </div>
      </section>

      <aside className="h-fit border border-border bg-secondary/45 p-6 lg:sticky lg:top-32">
        <h2 className="font-heading text-3xl">Payment</h2>
        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">Choose a payment method</legend>
          <label className={`flex cursor-pointer gap-3 border p-4 transition-colors ${paymentMethod === "PAYMOB" ? "border-primary bg-card" : "border-border bg-transparent"}`}>
            <input type="radio" name="paymentMethod" value="PAYMOB" checked={paymentMethod === "PAYMOB"} onChange={() => setPaymentMethod("PAYMOB")} className="mt-1 accent-primary" />
            <CreditCard className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span><span className="block font-medium">Pay online</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Secure Paymob test checkout. Cards and available methods appear on Paymob.</span></span>
          </label>
          <label className={`flex cursor-pointer gap-3 border p-4 transition-colors ${paymentMethod === "COD" ? "border-primary bg-card" : "border-border bg-transparent"}`}>
            <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="mt-1 accent-primary" />
            <Banknote className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span><span className="block font-medium">Cash on delivery</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Pay in cash when your Talié order arrives.</span></span>
          </label>
        </fieldset>
        <dl className="mt-7 space-y-4 border-y border-border py-5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatEgp(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{estimatedShipping === null ? "Calculated from address" : estimatedShipping === 0 ? "Complimentary" : formatEgp(estimatedShipping)}</dd></div>
        </dl>
        {state.error ? <p role="alert" className="mt-5 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" className="mt-6 h-12 w-full rounded-none" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}{paymentMethod === "PAYMOB" ? "Continue to secure payment" : "Place COD order"}</Button>
        <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {paymentMethod === "PAYMOB" ? "Stock is reserved for one hour while you complete payment." : "Stock is committed when your COD order is placed."}</p>
      </aside>
    </form>
  );
}
