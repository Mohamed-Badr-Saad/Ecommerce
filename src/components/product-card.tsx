import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleWishlistAction } from "@/app/account/actions";
import type { CatalogProduct } from "@/lib/catalog";
import { formatEgp } from "@/lib/storefront";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden bg-muted">
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          <div className="relative aspect-[3/4]">
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
            />
          </div>
        </Link>
        {product.stockQuantity <= 0 ? <div className="absolute inset-0 bg-background/35" /> : null}
        {product.badge ? (
          <Badge className="absolute left-3 top-3 rounded-none bg-background px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-foreground">
            {product.badge}
          </Badge>
        ) : null}
        <form action={toggleWishlistAction.bind(null, product.slug)} className="absolute right-3 top-3">
          <Button type="submit" variant="secondary" size="icon" className="rounded-full bg-background/90 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100" aria-label={`Toggle ${product.name} in wishlist`}><Heart /></Button>
        </form>
      </div>
      <div className="pt-4">
        <h3 className="text-sm font-medium sm:text-base">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{product.category}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span>{formatEgp(product.price)}</span>
          {product.compareAtPrice ? (
            <span className="text-muted-foreground line-through">
              {formatEgp(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
