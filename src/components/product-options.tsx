"use client";

import { useActionState, useState } from "react";
import { Check, LoaderCircle, Minus } from "lucide-react";

import { addToCartAction } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";

type Variant = { id: string; title: string; color: string | null; colorHex: string | null; size: string | null; stockQuantity: number };

export function ProductOptions({ productId, variants }: { productId: string; variants: Variant[] }) {
  const firstAvailable = variants.find((variant) => variant.stockQuantity > 0)?.id ?? variants[0]?.id;
  const [selectedId, setSelectedId] = useState(firstAvailable);
  const selected = variants.find((variant) => variant.id === selectedId);
  const [state, action, pending] = useActionState(addToCartAction.bind(null, productId), {});

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Choose an option</p>
        <p className="text-xs text-muted-foreground">{selected?.stockQuantity ? `${selected.stockQuantity} available` : "Unavailable"}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {variants.map((variant) => {
          const active = selectedId === variant.id;
          return (
            <Button key={variant.id} type="button" variant={active ? "default" : "outline"} className="h-auto min-h-12 rounded-none px-3 py-2" onClick={() => setSelectedId(variant.id)} disabled={variant.stockQuantity <= 0}>
              {active ? <Check className="size-3.5" /> : variant.stockQuantity <= 0 ? <Minus className="size-3.5" /> : null}
              <span>{variant.color}{variant.size ? ` · ${variant.size}` : ""}</span>
            </Button>
          );
        })}
      </div>
      <form action={action} className="mt-4">
        <input type="hidden" name="variantId" value={selectedId ?? ""} />
        <input type="hidden" name="quantity" value="1" />
        <Button className="h-12 w-full rounded-none" disabled={!selected?.stockQuantity || pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null}{selected?.stockQuantity ? "Add to bag" : "Sold out"}
        </Button>
        {state.error ? <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p role="status" className="mt-3 text-sm text-primary">{state.success}</p> : null}
      </form>
    </div>
  );
}
