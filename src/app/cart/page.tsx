import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { removeCartItemAction, updateCartItemAction } from "./actions";
import { DiscountCodeForm } from "@/components/discount-code-form";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart";
import { formatEgp } from "@/lib/storefront";
import { getCurrentSession } from "@/lib/session";
import { getShippingSettings } from "@/lib/shipping";

export const metadata = { title: "Your bag" };

export default async function CartPage() {
  const [cart, session] = await Promise.all([getCart(), getCurrentSession()]);
  if (!cart.items.length) return <main className="mx-auto flex min-h-[65svh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center"><ShoppingBag className="size-9 text-primary" /><h1 className="mt-5 font-heading text-5xl">Your bag is empty</h1><p className="mt-4 text-muted-foreground">Browse our newest pieces and add your favourites.</p><Button asChild className="mt-8 h-12 rounded-none px-8"><Link href="/shop">Start shopping</Link></Button></main>;
  const canCheckout = cart.items.every((item) => item.available) && !cart.coupon?.error;
  const { freeShippingThreshold } = await getShippingSettings();
  const remaining = freeShippingThreshold === null ? null : Math.max(0, freeShippingThreshold - cart.amountDue);
  const checkoutHref = session ? "/checkout" : "/sign-up?callbackURL=/checkout";
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your selection</p><h1 className="mt-3 font-heading text-5xl">Shopping bag</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <section aria-label="Bag items" className="divide-y divide-border border-y border-border">
          {cart.items.map((item) => <article key={item.id} className="grid grid-cols-[6rem_1fr] gap-5 py-6 sm:grid-cols-[8rem_1fr_auto]">
            <Link href={`/products/${item.slug}`} className="relative aspect-[3/4] overflow-hidden bg-muted"><Image src={item.image} alt={item.title} fill sizes="8rem" className="object-cover" /></Link>
            <div><Link href={`/products/${item.slug}`} className="font-heading text-2xl hover:underline">{item.title}</Link>{item.variantTitle ? <p className="mt-1 text-sm text-muted-foreground">{item.variantTitle}</p> : null}<p className="mt-3 text-sm">{formatEgp(item.price)}</p>{!item.available ? <p className="mt-2 text-xs text-destructive">Only {item.availableStock} available. Update the quantity to continue.</p> : null}</div>
            <div className="col-start-2 flex flex-wrap items-center justify-between gap-3 sm:col-start-auto sm:flex-col sm:items-end">
              <p className="font-medium">{formatEgp(item.lineTotal)}</p>
              <div className="flex items-center border border-border" role="group" aria-label={`Quantity for ${item.title}`}>
                <form action={updateCartItemAction.bind(null, item.id)}><input type="hidden" name="quantity" value={item.quantity - 1} /><Button type="submit" variant="ghost" size="icon" className="rounded-none" disabled={item.quantity <= 1} aria-label={`Decrease ${item.title} quantity`}><Minus aria-hidden="true" /></Button></form>
                <output className="min-w-10 text-center text-sm font-medium" aria-live="polite">{item.quantity}</output>
                <form action={updateCartItemAction.bind(null, item.id)}><input type="hidden" name="quantity" value={item.quantity + 1} /><Button type="submit" variant="ghost" size="icon" className="rounded-none" disabled={item.quantity >= Math.min(10, item.availableStock)} aria-label={`Increase ${item.title} quantity`}><Plus aria-hidden="true" /></Button></form>
              </div>
              <form action={removeCartItemAction.bind(null, item.id)}><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground"><Trash2 /> Remove</Button></form>
            </div>
          </article>)}
        </section>
        <aside className="h-fit border border-border bg-secondary/45 p-6 lg:sticky lg:top-32"><h2 className="font-heading text-3xl">Order summary</h2><dl className="mt-6 space-y-4 border-y border-border py-5 text-sm"><div className="flex justify-between"><dt>Items ({cart.count})</dt><dd>{formatEgp(cart.originalSubtotal)}</dd></div>{cart.discount > 0 ? <div className="flex justify-between text-emerald-700"><dt>Sale savings</dt><dd>−{formatEgp(cart.discount)}</dd></div> : null}{cart.couponDiscount > 0 ? <div className="flex justify-between text-emerald-700"><dt>Discount code {cart.coupon?.code}</dt><dd>−{formatEgp(cart.couponDiscount)}</dd></div> : null}<div className="flex justify-between"><dt>Delivery</dt><dd>At checkout</dd></div></dl><div className="mt-5 flex justify-between font-medium"><span>Subtotal</span><span>{formatEgp(cart.amountDue)}</span></div>{remaining === null ? null : <p className="mt-4 text-xs leading-5 text-muted-foreground">{remaining ? `Add ${formatEgp(remaining)} more to get free delivery.` : "Your order gets free delivery."}</p>}<DiscountCodeForm coupon={cart.coupon} />{!session ? <p className="mt-4 border border-primary/20 bg-card p-3 text-xs leading-5">Create a free account to check out. Your bag is saved, and you can track your order from your account.</p> : null}<Button asChild className="mt-6 h-12 w-full rounded-none" aria-disabled={!canCheckout}><Link href={canCheckout ? checkoutHref : "/cart"}>{session ? "Continue to checkout" : "Create account & check out"}</Link></Button></aside>
      </div>
    </main>
  );
}
