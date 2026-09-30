"use client";

import { useActionState } from "react";
import { LoaderCircle, TicketPercent, X } from "lucide-react";

import { applyDiscountCodeAction, removeDiscountCodeAction } from "@/app/cart/actions";
import { formatEgp } from "@/lib/storefront";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type AppliedCoupon = { code: string; amount: number; error: string | null } | null;

export function DiscountCodeForm({ coupon }: { coupon: AppliedCoupon }) {
  const [state, action, pending] = useActionState(applyDiscountCodeAction, {});

  if (coupon) {
    return (
      <div className="mt-5 border border-border bg-card p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 font-medium"><TicketPercent className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate">{coupon.code}</span></p>
          <form action={removeDiscountCodeAction}>
            <Button type="submit" variant="ghost" size="sm" className="h-8 rounded-none text-muted-foreground" aria-label={`Remove discount code ${coupon.code}`}><X aria-hidden="true" /> Remove</Button>
          </form>
        </div>
        {coupon.error
          ? <p role="alert" className="mt-2 text-xs leading-5 text-destructive">{coupon.error}</p>
          : <p className="mt-1 text-xs text-emerald-700">You save {formatEgp(coupon.amount)} with this code.</p>}
      </div>
    );
  }

  return (
    <form action={action} className="mt-5">
      <label htmlFor="discount-code" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discount code</label>
      <div className="mt-2 flex gap-2">
        <Input id="discount-code" name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={32} required placeholder="Enter code" className="h-11 rounded-none bg-card uppercase placeholder:normal-case" aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "discount-code-error" : undefined} />
        <Button type="submit" variant="outline" className="h-11 rounded-none px-5" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}Apply</Button>
      </div>
      {state.error ? <p id="discount-code-error" role="alert" className="mt-2 text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}
