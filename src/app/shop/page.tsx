import type { Metadata } from "next";

import { CatalogPage } from "@/components/catalog-page";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop the Edit",
  description: "Discover Talié abayas, modest dresses, and coordinated sets, designed for thoughtful everyday layering.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const query = parseCatalogQuery(await searchParams);
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <header className="mb-12 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">The complete wardrobe</p>
        <h1 className="mt-4 font-heading text-5xl leading-none tracking-[-0.04em] sm:text-6xl">Shop the edit</h1>
        <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Refined layers, full-length silhouettes, and effortless sets in the signature Talié palette.</p>
      </header>
      <CatalogPage query={query} pathname="/shop" />
    </main>
  );
}
