"use client";

import { useId, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import Form from "next/form";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Field = "collection" | "category" | "size" | "color" | "availability";
type Option = { label: string; value: string; swatch?: string | null };
type Selection = Record<Field, string[]>;

const SORT_OPTIONS: { label: string; value: CatalogQuery["sort"] }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Name", value: "name" },
];

const chipClass =
  "inline-flex min-h-9 cursor-pointer select-none items-center gap-2 border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary/60 has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring";

/** One filter section with a header that shows or hides its options. */
function Section({ title, summary, open, onToggle, children }: { title: string; summary?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const contentId = useId();
  return (
    <section className="border-t border-border first:border-t-0">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={contentId} className="flex w-full items-center justify-between gap-3 py-4 text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">{title}</span>
          <span className="flex min-w-0 items-center gap-2">
            {summary ? <span className="truncate text-xs text-muted-foreground">{summary}</span> : null}
            <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
          </span>
        </button>
      </h3>
      {/* Hidden sections stay in the form, so their ticks are still applied. */}
      <div id={contentId} className={cn("pb-5", !open && "hidden")}>{children}</div>
    </section>
  );
}

function Chips({ field, options, selected, onToggle, submitName }: { field: Field; options: Option[]; selected: string[]; onToggle: (field: Field, value: string) => void; submitName?: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label key={option.value} className={chipClass}>
            {/* Real checkboxes, so the form also works before JavaScript loads. */}
            <input type="checkbox" name={submitName === null ? undefined : submitName ?? field} value={option.value} checked={checked} onChange={() => onToggle(field, option.value)} className="sr-only" />
            {checked ? <Check className="size-3.5" aria-hidden="true" /> : null}
            {option.swatch ? <span className="size-3 rounded-full border border-black/15" style={{ backgroundColor: option.swatch }} aria-hidden="true" /> : null}
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Shop filters. Customers tick as many options as they like in each section, then press
 * "Apply filters". Each section folds open and closed; on phones the whole panel folds away
 * once the filters are applied. The parent remounts this component (key) when the applied
 * filters change, so it always matches the page.
 */
export function CatalogControls({
  query,
  categories,
  collections,
  colors,
  sizes,
  pathname,
  currentCollection,
}: {
  query: CatalogQuery;
  categories: { name: string; slug: string }[];
  collections: { name: string; slug: string }[];
  colors: { name: string; hex: string | null }[];
  sizes: string[];
  pathname: string;
  /** Set on a collection's own page: that collection starts ticked. */
  currentCollection?: string;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(query.q ?? "");
  const [sort, setSort] = useState<CatalogQuery["sort"]>(query.sort);
  const [selected, setSelected] = useState<Selection>({
    collection: currentCollection ? [currentCollection] : query.collection,
    category: query.category,
    size: query.size,
    color: query.color,
    availability: query.availability,
  });
  // Sections with something ticked start open; the others start folded.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    collection: !currentCollection && query.collection.length > 0,
    category: query.category.length > 0,
    size: query.size.length > 0,
    color: query.color.length > 0,
    availability: query.availability.length > 0,
    sort: false,
  }));
  const toggleSection = (key: string) => setOpenSections((current) => ({ ...current, [key]: !current[key] }));

  const appliedCount = query.collection.length + query.category.length + query.size.length + query.color.length + query.availability.length;
  // On a collection's page, that collection itself doesn't count as an extra filter.
  const extraCollections = selected.collection.filter((slug) => slug !== currentCollection);
  const selectedCount = extraCollections.length + selected.category.length + selected.size.length + selected.color.length + selected.availability.length;
  const hasChoices = selectedCount > 0 || search.trim() !== "" || sort !== "newest" || (currentCollection ? selected.collection.join() !== currentCollection : false);

  // On a collection's page, keeping just that collection stays on the page; any other choice opens the shop with those collections.
  const stayOnCollectionPage = Boolean(currentCollection) && selected.collection.length === 1 && selected.collection[0] === currentCollection;
  const action = currentCollection && !stayOnCollectionPage ? "/shop" : pathname;

  const toggle = (field: Field, value: string) =>
    setSelected((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value],
    }));

  const reset = () => {
    setSelected({ collection: currentCollection ? [currentCollection] : [], category: [], size: [], color: [], availability: [] });
    setSearch("");
    setSort("newest");
  };

  // Sorting applies straight away, like before (together with any ticks made so far).
  const chooseSort = (value: CatalogQuery["sort"]) => {
    flushSync(() => setSort(value));
    (document.getElementById(panelId) as HTMLFormElement | null)?.requestSubmit();
  };

  const optionLabel = (count: number) => (count ? `${count} selected` : undefined);

  return (
    <aside aria-label="Catalog filters" className="lg:self-start">
      {/* Phones and tablets: one button that shows or hides the panel. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between border-y border-border py-4 text-sm font-semibold lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" aria-hidden="true" /> Filter &amp; sort
          {appliedCount ? <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] text-primary-foreground">{appliedCount}</span> : null}
        </span>
        <span className="text-xs font-normal text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>

      <Form id={panelId} action={action} onSubmit={() => setOpen(false)} className={cn("mt-4 lg:mt-0 lg:block", open ? "block" : "hidden")}>
        <div className="mb-2 flex gap-2">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" aria-label="Search products" maxLength={80} enterKeyHint="search" className="h-11 rounded-none bg-card" />
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-none" aria-label="Search"><Search /></Button>
        </div>
        {/* Only send search and sort when they're used, so links stay short. */}
        {search.trim() ? <input type="hidden" name="q" value={search.trim()} /> : null}
        {sort !== "newest" ? <input type="hidden" name="sort" value={sort} /> : null}

        {collections.length ? (
          <Section title="Collection" summary={optionLabel(currentCollection ? extraCollections.length : selected.collection.length)} open={openSections.collection} onToggle={() => toggleSection("collection")}>
            <Chips field="collection" selected={selected.collection} onToggle={toggle} submitName={stayOnCollectionPage ? null : undefined} options={collections.map((item) => ({ label: item.name, value: item.slug }))} />
          </Section>
        ) : null}
        {categories.length ? (
          <Section title="Category" summary={optionLabel(selected.category.length)} open={openSections.category} onToggle={() => toggleSection("category")}>
            <Chips field="category" selected={selected.category} onToggle={toggle} options={categories.map((item) => ({ label: item.name, value: item.slug }))} />
          </Section>
        ) : null}
        {sizes.length ? (
          <Section title="Size" summary={optionLabel(selected.size.length)} open={openSections.size} onToggle={() => toggleSection("size")}>
            <Chips field="size" selected={selected.size} onToggle={toggle} options={sizes.map((size) => ({ label: size, value: size }))} />
          </Section>
        ) : null}
        {colors.length ? (
          <Section title="Colour" summary={optionLabel(selected.color.length)} open={openSections.color} onToggle={() => toggleSection("color")}>
            <Chips field="color" selected={selected.color} onToggle={toggle} options={colors.map((color) => ({ label: color.name, value: color.name, swatch: color.hex }))} />
          </Section>
        ) : null}
        <Section title="Availability" summary={optionLabel(selected.availability.length)} open={openSections.availability} onToggle={() => toggleSection("availability")}>
          <Chips field="availability" selected={selected.availability} onToggle={toggle} options={[{ label: "In stock", value: "in-stock" }, { label: "Sold out", value: "sold-out" }]} />
        </Section>

        <Section title="Sort by" summary={SORT_OPTIONS.find((option) => option.value === sort)?.label} open={openSections.sort} onToggle={() => toggleSection("sort")}>
          <div className="grid gap-2" role="radiogroup" aria-label="Sort by">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={sort === option.value}
                onClick={() => chooseSort(option.value)}
                className={cn("w-fit text-left text-sm underline-offset-4 hover:underline", sort === option.value ? "font-semibold text-primary" : "text-muted-foreground")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Follows the page while scrolling through long filter lists. On phones the right side leaves room for the social button. */}
        <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-border bg-background pb-4 pr-16 pt-3 lg:pr-0">
          <Button type="submit" className="h-11 flex-1 rounded-none">
            Apply filters{selectedCount ? ` (${selectedCount})` : ""}
          </Button>
          {hasChoices ? (
            <Button type="button" variant="outline" className="h-11 rounded-none px-3" onClick={reset} aria-label="Clear all selections">
              <RotateCcw aria-hidden="true" /> Reset
            </Button>
          ) : null}
        </div>
      </Form>
    </aside>
  );
}
