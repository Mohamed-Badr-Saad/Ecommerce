import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogQueryString, type CatalogQuery } from "@/lib/catalog";

type Option = { label: string; value: string; swatch?: string | null };

function FilterGroup({
  label,
  options,
  active,
  query,
  field,
  pathname,
}: {
  label: string;
  options: Option[];
  active?: string;
  query: CatalogQuery;
  field: "category" | "color" | "size" | "availability";
  pathname: string;
}) {
  return (
    <fieldset className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = active === option.value;
          return (
            <Button key={option.value} asChild variant={selected ? "default" : "outline"} size="sm" className="h-9 rounded-none font-normal">
              <Link href={`${pathname}${catalogQueryString(query, { [field]: selected ? undefined : option.value, page: 1 })}`}>
                {option.swatch ? <span className="size-3 rounded-full border border-black/15" style={{ backgroundColor: option.swatch }} /> : null}
                {option.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CatalogControls({
  query,
  categories,
  colors,
  sizes,
  pathname,
}: {
  query: CatalogQuery;
  categories: { name: string; slug: string }[];
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  pathname: string;
}) {
  const hasFilters = Boolean(query.q || query.category || query.color || query.size || query.availability || query.sort !== "newest");
  const filterContent = (mobile: boolean) => <>
      <form action={pathname} className="mb-6 flex gap-2">
        <Input name="q" defaultValue={query.q} placeholder="Search pieces" aria-label="Search products" className="h-11 rounded-none bg-card" />
        <Button type="submit" size="icon" className="size-11 shrink-0 rounded-none" aria-label="Submit search"><Search /></Button>
      </form>

      <FilterGroup label="Category" field="category" active={query.category} query={query} pathname={pathname} options={categories.map((item) => ({ label: item.name, value: item.slug }))} />
      <FilterGroup label="Size" field="size" active={query.size} query={query} pathname={pathname} options={sizes.map((size) => ({ label: size, value: size }))} />
      <FilterGroup label="Colour" field="color" active={query.color} query={query} pathname={pathname} options={colors.map((color) => ({ label: color.name, value: color.name, swatch: color.hex }))} />
      <FilterGroup label="Availability" field="availability" active={query.availability} query={query} pathname={pathname} options={[{ label: "In stock", value: "in-stock" }, { label: "Sold out", value: "sold-out" }]} />

      <fieldset className="border-t border-border py-5">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]">Sort by</legend>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {[
            ["Newest", "newest"], ["Price: low to high", "price-asc"], ["Price: high to low", "price-desc"], ["Name", "name"],
          ].map(([label, value]) => (
            <Link key={value} href={`${pathname}${catalogQueryString(query, { sort: value as CatalogQuery["sort"], page: 1 })}`} className={`text-sm underline-offset-4 hover:underline ${query.sort === value ? "font-semibold text-primary" : "text-muted-foreground"}`}>{label}</Link>
          ))}
        </div>
      </fieldset>

      {hasFilters ? <Button asChild variant="outline" className="w-full rounded-none"><Link href={pathname}><X /> Clear all filters</Link></Button> : null}
      {mobile ? <p className="mt-4 text-xs text-muted-foreground">Select a filter to apply it and close this panel.</p> : null}
    </>;

  return (
    <aside aria-label="Catalog filters" className="lg:sticky lg:top-32 lg:self-start">
      <details className="group border-y border-border py-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2"><SlidersHorizontal className="size-4" /> Refine the edit</span>
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">Open filters</span>
          <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Close filters</span>
        </summary>
        <div className="mt-6">{filterContent(true)}</div>
      </details>
      <div className="hidden lg:block">{filterContent(false)}</div>
    </aside>
  );
}
