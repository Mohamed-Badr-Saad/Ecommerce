import { Heart, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductOptions } from "@/components/product-options";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { toggleWishlistAction } from "@/app/account/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProduct } from "@/lib/catalog";
import { formatEgp } from "@/lib/storefront";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  const description = product.seoDescription ?? product.description;
  return {
    title: product.seoTitle ?? product.title,
    description,
    openGraph: { title: product.title, description, images: product.images[0]?.url ? [{ url: product.images[0].url, alt: product.images[0].altText ?? product.title }] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const inStock = product.stockQuantity > 0;
  const galleryImages = (product.images.length ? product.images : [{ id: "placeholder", url: "/products/dress-mauve.svg", altText: product.title }]).map((image) => ({ id: image.id, url: image.url, altText: image.altText ?? product.title }));
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-14">
      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
        <Link href="/shop" className="hover:text-foreground">Shop</Link><span>/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link><span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)] lg:gap-16">
        <ProductImageGallery images={galleryImages} productTitle={product.title} />

        <section className="lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{product.category.name}</p>
              <h1 className="mt-3 font-heading text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">{product.title}</h1>
            </div>
            <form action={toggleWishlistAction.bind(null, product.slug)}><Button type="submit" variant="outline" size="icon" className="shrink-0 rounded-full" aria-label={`Toggle ${product.title} in wishlist`}><Heart /></Button></form>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <p className="text-lg">{formatEgp(Number(product.price))}</p>
            {product.compareAtPrice ? <p className="text-sm text-muted-foreground line-through">{formatEgp(Number(product.compareAtPrice))}</p> : null}
            <Badge variant={inStock ? "secondary" : "outline"} className="ml-auto rounded-none">{inStock ? product.stockQuantity <= product.lowStockThreshold ? "Low stock" : "In stock" : "Sold out"}</Badge>
          </div>
          <p className="mt-7 leading-7 text-muted-foreground">{product.description}</p>
          <ProductOptions productId={product.id} productTitle={product.title} productStock={product.stockQuantity} variants={product.variants.map((variant) => ({ id: variant.id, title: variant.title, color: variant.color, colorHex: variant.colorHex, size: variant.size, stockQuantity: variant.stockQuantity }))} />
          <Separator className="my-8" />
          <div className="grid gap-5 text-sm">
            <div className="flex gap-3"><Truck className="mt-0.5 size-5 text-primary" /><div><p className="font-medium">Egypt-wide delivery</p><p className="mt-1 text-muted-foreground">Shipping rates are confirmed at checkout.</p></div></div>
            <div className="flex gap-3"><RotateCcw className="mt-0.5 size-5 text-primary" /><div><p className="font-medium">Easy returns</p><p className="mt-1 text-muted-foreground">Not the right fit? Contact us with your order number and we’ll help.</p></div></div>
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary" /><div><p className="font-medium">Secure shopping</p><p className="mt-1 text-muted-foreground">Pay securely by card with Paymob or choose cash on delivery.</p></div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
