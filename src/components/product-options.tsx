"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { addToCartAction, type CartActionState } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";
import { CART_MAX_QUANTITY } from "@/lib/commerce";

type Variant = { id: string; title: string; color: string | null; colorHex: string | null; size: string | null; stockQuantity: number };

type Props = {
  productId: string;
  productTitle: string;
  /** Stock of the base product, used when it has no variants. */
  productStock: number;
  variants: Variant[];
};

export function ProductOptions({ productId, productTitle, productStock, variants }: Props) {
  const router = useRouter();
  const firstAvailable = variants.find((variant) => variant.stockQuantity > 0)?.id ?? variants[0]?.id;
  const [selectedId, setSelectedId] = useState(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const selected = variants.find((variant) => variant.id === selectedId);
  const stock = variants.length ? selected?.stockQuantity ?? 0 : productStock;
  const maxQuantity = Math.max(1, Math.min(stock, CART_MAX_QUANTITY));
  const shownQuantity = Math.min(quantity, maxQuantity);
  const optionLabel = selected ? [selected.color, selected.size].filter(Boolean).join(" · ") || selected.title : null;

  const [, action, pending] = useActionState(async (previous: CartActionState, formData: FormData) => {
    const result = await addToCartAction(productId, previous, formData);
    const added = Number(formData.get("quantity")) || 1;
    if (result.success) {
      toast.success("Added to your bag", {
        description: `${added} × ${productTitle}${optionLabel ? ` · ${optionLabel}` : ""}`,
        action: { label: "View bag", onClick: () => router.push("/cart") },
      });
      setQuantity(1);
    } else if (result.error) {
      toast.error("Couldn’t add to bag", { description: result.error });
    }
    return result;
  }, {});

  const selectVariant = (id: string) => {
    setSelectedId(id);
    setQuantity(1);
  };

  return (
    <div className="mt-8">
      {variants.length ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Choose an option</p>
            <p className="text-xs text-muted-foreground">{stock ? `${stock} available` : "Unavailable"}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variants.map((variant) => {
              const active = selectedId === variant.id;
              return (
                <Button key={variant.id} type="button" variant={active ? "default" : "outline"} className="h-auto min-h-12 rounded-none px-3 py-2" onClick={() => selectVariant(variant.id)} disabled={variant.stockQuantity <= 0} aria-pressed={active}>
                  {active ? <Check className="size-3.5" /> : variant.stockQuantity <= 0 ? <Minus className="size-3.5" /> : null}
                  <span>{variant.color}{variant.size ? ` · ${variant.size}` : ""}</span>
                </Button>
              );
            })}
          </div>
        </>
      ) : null}
      <form action={action} className="mt-4">
        <input type="hidden" name="variantId" value={variants.length ? selectedId ?? "" : ""} />
        <input type="hidden" name="quantity" value={shownQuantity} />
        <div className="flex gap-3">
          <div className="flex h-12 shrink-0 items-center border border-border" role="group" aria-label="Quantity">
            <Button type="button" variant="ghost" size="icon" className="h-full w-11 rounded-none" onClick={() => setQuantity(Math.max(1, shownQuantity - 1))} disabled={!stock || shownQuantity <= 1 || pending} aria-label="Decrease quantity"><Minus aria-hidden="true" /></Button>
            <output className="min-w-10 text-center text-sm font-medium" aria-live="polite" aria-label={`Quantity ${shownQuantity}`}>{stock ? shownQuantity : 0}</output>
            <Button type="button" variant="ghost" size="icon" className="h-full w-11 rounded-none" onClick={() => setQuantity(Math.min(maxQuantity, shownQuantity + 1))} disabled={!stock || shownQuantity >= maxQuantity || pending} aria-label="Increase quantity"><Plus aria-hidden="true" /></Button>
          </div>
          <Button className="h-12 flex-1 rounded-none" disabled={!stock || pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : null}{stock ? "Add to bag" : "Sold out"}
          </Button>
        </div>
        {stock && shownQuantity >= maxQuantity && maxQuantity > 1 ? <p className="mt-2 text-xs text-muted-foreground">{maxQuantity === CART_MAX_QUANTITY ? `Up to ${CART_MAX_QUANTITY} per order.` : `Only ${maxQuantity} available.`}</p> : null}
      </form>
    </div>
  );
}
