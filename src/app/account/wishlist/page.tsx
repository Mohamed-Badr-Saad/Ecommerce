import { Heart } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function WishlistPage() {
  const session = await requireSession();
  const items = await prisma.wishlistItem.findMany({ where: { wishlist: { userId: session.user.id } }, include: { product: { include: { category: { select: { name: true } }, images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }], take: 1 } } } }, orderBy: { createdAt: "desc" } });
  const products = items.map(({ product }) => ({ name: product.title, slug: product.slug, price: Number(product.price), compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined, badge: product.stockQuantity <= 0 ? "Sold out" : product.isSale ? "Sale" : undefined, image: product.images[0]?.url ?? "/products/dress-mauve.svg", imageAlt: product.images[0]?.altText ?? product.title, category: product.category.name, stockQuantity: product.stockQuantity }));
  return <section><h2 className="font-heading text-4xl">Your wishlist</h2><p className="mt-2 text-muted-foreground">A considered shortlist of pieces you want to revisit.</p>{products.length ? <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 md:gap-x-5">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="mt-8 flex min-h-80 flex-col items-center justify-center border border-border bg-card px-6 text-center"><Heart className="size-8 text-primary" /><h3 className="mt-4 font-heading text-3xl">Nothing saved yet</h3><p className="mt-2 max-w-sm text-muted-foreground">Use the heart on any product to keep it here.</p><Button asChild className="mt-6 rounded-none"><Link href="/shop">Explore the edit</Link></Button></div>}</section>;
}
