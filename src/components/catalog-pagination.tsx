import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { catalogQueryString, type CatalogQuery } from "@/lib/catalog";

export function CatalogPagination({ query, pageCount, pathname }: { query: CatalogQuery; pageCount: number; pathname: string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Catalog pagination" className="mt-14 flex items-center justify-center gap-3">
      <Button asChild={query.page > 1} variant="outline" size="icon" className="rounded-none" disabled={query.page <= 1}>
        {query.page > 1 ? <Link href={`${pathname}${catalogQueryString(query, { page: query.page - 1 })}`} aria-label="Previous page"><ChevronLeft /></Link> : <ChevronLeft />}
      </Button>
      <span className="min-w-24 text-center text-sm text-muted-foreground">Page {query.page} of {pageCount}</span>
      <Button asChild={query.page < pageCount} variant="outline" size="icon" className="rounded-none" disabled={query.page >= pageCount}>
        {query.page < pageCount ? <Link href={`${pathname}${catalogQueryString(query, { page: query.page + 1 })}`} aria-label="Next page"><ChevronRight /></Link> : <ChevronRight />}
      </Button>
    </nav>
  );
}
