"use client";

import { useActionState } from "react";
import { Banknote, CreditCard, LoaderCircle, ShoppingBag } from "lucide-react";

import { pendingPaymentAction } from "@/app/account/orders/actions";
import { Button } from "./ui/button";

type Options = { canResume: boolean; canSwitchToCod: boolean; canCancel: boolean };

export function PendingPaymentActions({ orderNumber, options, expiresAt }: { orderNumber: string; options: Options; expiresAt: string | null }) {
  const [state, action, pending] = useActionState(pendingPaymentAction.bind(null, orderNumber), {});
  const confirmCancel = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm("Cancel this order and move its pieces back to your bag?")) event.preventDefault();
  };

  return (
    <div className="border border-primary/25 bg-card p-4 text-sm">
      <p className="font-medium">Payment not completed</p>
      <p className="mt-1 leading-6 text-muted-foreground">
        {options.canResume && expiresAt
          ? `Your pieces are reserved until ${new Date(expiresAt).toLocaleTimeString("en-EG", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" })}. Finish paying online, or choose another option.`
          : "Online payment for this order can’t be reopened. You can still receive it with cash on delivery, or move the pieces back to your bag and check out again."}
      </p>
      <form action={action} className="mt-4 flex flex-wrap gap-2">
        {options.canResume ? <Button type="submit" name="intent" value="resume" className="rounded-none" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />} Complete payment</Button> : null}
        {options.canSwitchToCod ? <Button type="submit" name="intent" value="cod" variant={options.canResume ? "outline" : "default"} className="rounded-none" disabled={pending}><Banknote aria-hidden="true" /> Pay cash on delivery instead</Button> : null}
        {options.canCancel ? <Button type="submit" name="intent" value="cancel" variant="ghost" className="rounded-none" disabled={pending} onClick={confirmCancel}><ShoppingBag aria-hidden="true" /> Cancel &amp; return to bag</Button> : null}
      </form>
      {state.error ? <p role="alert" className="mt-3 text-xs text-destructive">{state.error}</p> : null}
    </div>
  );
}
