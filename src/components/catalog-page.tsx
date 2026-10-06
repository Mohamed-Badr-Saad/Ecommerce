import { PackageSearch, X } from "lucide-react";

import { CatalogControls } from "@/components/catalog-controls";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { CATALOG_FILTER_FIELDS, catalogQueryString, countActiveFilters, getCatalog, type CatalogQuery } from "@/lib/catalog";
import Link from "next/link";

const sortLabels: Record<string, string> = { newest: "newest", "price-asc": "price: low to high", "price-desc": "price: high to low", name: "name (A–Z)" };
const availabilityLabels: Record<string, string> = { "in-stock": "In stock", "sold-out": "Sold out" };

/** The filters that are applied right now, each with an × to remove just that one. */
function ActiveFilters({ query, pathname, labels }: { query: CatalogQuery; pathname: string; labels: { category: Map<string, string>; collection: Map<string, string> } }) {
  const chips = CATALOG_FILTER_FIELDS.flatMap((field) =>
    (query[field] as string[]).map((value) => ({
      key: `${field}:${value}`,
      label: field === "category" || field === "collection" ? labels[field].get(value) ?? value : field === "availability" ? availabilityLabels[value] ?? value : value,
      href: `${pathname}${catalogQueryString(query, { [field]: (query[field] as string[]).filter((item) => item !== value), page: 1 } as Partial<CatalogQuery>)}`,
    })),
  );
  if (query.q) chips.unshift({ key: "q", label: `“${query.q}”`, href: `${pathname}${catalogQueryString(query, { q: undefined, page: 1 })}` });
  if (!chips.length) return null;
  return (
    <div className="mb-7 flex flex-wrap items-center gap-2" aria-label="Applied filters">
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-1 text-xs hover:border-primary" aria-label={`Remove filter ${chip.label}`}>
          {chip.label}<X className="size-3" aria-hidden="true" />
        </Link>
      ))}
      <Link href={`${pathname}${catalogQueryString(query, { q: undefined, collection: [], category: [], size: [], color: [], availability: [], page: 1 })}`} className="ml-1 text-xs underline underline-offset-4 hover:text-primary">Clear all</Link>
    </div>
  );
}

export async function CatalogPage({ query, pathname, collectionSlug }: { query: CatalogQuery; pathname: string; collectionSlug?: string }) {
  let catalog = await getCatalog(query, collectionSlug);
  const safePage = Math.min(query.page, catalog.pageCount);
  const effectiveQuery = safePage === query.page ? query : { ...query, page: safePage };
  if (safePage !== query.page) catalog = await getCatalog(effectiveQuery, collectionSlug);

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
      {/* Remounts when the applied filters change, so the panel always matches the page (and closes on phones). */}
      <CatalogControls key={catalogQueryString(effectiveQuery, { page: 1 })} query={effectiveQuery} categories={catalog.categories} collections={catalog.collections} currentCollection={collectionSlug} colors={catalog.colors} sizes={catalog.sizes} pathname={pathname} />
      <div className="min-w-0">
        <div className="mb-7 flex min-w-0 items-center justify-between gap-4 border-b border-border pb-4 text-sm text-muted-foreground">
          <p>{catalog.total} {catalog.total === 1 ? "product" : "products"}</p>
          <p className="truncate text-right">Sorted by {sortLabels[effectiveQuery.sort] ?? "newest"}</p>
        </div>
        <ActiveFilters
          query={effectiveQuery}
          pathname={pathname}
          labels={{ category: new Map(catalog.categories.map((item) => [item.slug, item.name])), collection: new Map(catalog.collections.map((item) => [item.slug, item.name])) }}
        />
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
            <h2 className="mt-5 font-heading text-3xl">No products match</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{countActiveFilters(effectiveQuery) > 1 ? "Try removing one of the filters above, or searching for something else." : "Try removing a filter or searching for something else."}</p>
            <Button asChild variant="outline" className="mt-6 rounded-none"><Link href={pathname}>Show all products</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
