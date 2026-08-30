import { PackageSearch } from "lucide-react";

import { CatalogControls } from "@/components/catalog-controls";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { getCatalog, type CatalogQuery } from "@/lib/catalog";
import Link from "next/link";

export async function CatalogPage({ query, pathname, collectionSlug }: { query: CatalogQuery; pathname: string; collectionSlug?: string }) {
  let catalog = await getCatalog(query, collectionSlug);
  const safePage = Math.min(query.page, catalog.pageCount);
  const effectiveQuery = safePage === query.page ? query : { ...query, page: safePage };
  if (safePage !== query.page) catalog = await getCatalog(effectiveQuery, collectionSlug);

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
      <CatalogControls query={effectiveQuery} categories={catalog.categories} collections={collectionSlug ? [] : catalog.collections} colors={catalog.colors} sizes={catalog.sizes} pathname={pathname} />
      <div className="min-w-0">
        <div className="mb-7 flex min-w-0 items-center justify-between gap-4 border-b border-border pb-4 text-sm text-muted-foreground">
          <p>{catalog.total} {catalog.total === 1 ? "piece" : "pieces"}</p>
          <p className="truncate text-right capitalize">Sorted by {effectiveQuery.sort.replaceAll("-", " ")}</p>
        </div>
        {catalog.products.length ? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4 md:gap-x-5">
              {catalog.products.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>
            <CatalogPagination query={effectiveQuery} pageCount={catalog.pageCount} pathname={pathname} />
          </>
        ) : (
          <div className="flex min-h-96 flex-col items-center justify-center border border-border bg-card px-6 text-center">
            <PackageSearch className="size-9 text-primary" />
            <h2 className="mt-5 font-heading text-3xl">No pieces found</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Try clearing a filter or searching for a different style.</p>
            <Button asChild variant="outline" className="mt-6 rounded-none"><Link href={pathname}>View the full edit</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
