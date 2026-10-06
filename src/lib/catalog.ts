import { cache } from "react";

import { Prisma } from "../generated/prisma/client";
import { CATALOG_CACHE_TAG, storefrontCache } from "./cache-tags";
import { prisma } from "./prisma";

export const CATALOG_PAGE_SIZE = 8;

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

/** Filters that accept several values at once (e.g. ?size=S&size=M). */
export const CATALOG_FILTER_FIELDS = ["collection", "category", "size", "color", "availability"] as const;
export type CatalogFilterField = (typeof CATALOG_FILTER_FIELDS)[number];
export type CatalogAvailability = "in-stock" | "sold-out";

export type CatalogQuery = {
  q?: string;
  /** Within one filter the values are alternatives (any of them); different filters must all match. */
  collection: string[];
  category: string[];
  color: string[];
  size: string[];
  availability: CatalogAvailability[];
  sort: "newest" | "price-asc" | "price-desc" | "name";
  page: number;
};

export type CatalogProduct = {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  image: string;
  imageAlt: string;
  category: string;
  stockQuantity: number;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const MAX_VALUES_PER_FILTER = 30;

/** All values of a repeated search param (?size=S&size=M), trimmed, de-duplicated and capped. */
function many(value: string | string[] | undefined) {
  const values = (Array.isArray(value) ? value : value === undefined ? [] : [value])
    .map((item) => item.trim().slice(0, 80))
    .filter(Boolean);
  return Array.from(new Set(values)).slice(0, MAX_VALUES_PER_FILTER);
}

export function parseCatalogQuery(params: CatalogSearchParams): CatalogQuery {
  const rawSort = first(params.sort);
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);

  return {
    q: first(params.q)?.trim().slice(0, 80) || undefined,
    collection: many(params.collection),
    category: many(params.category),
    color: many(params.color),
    size: many(params.size),
    availability: many(params.availability).filter((value): value is CatalogAvailability => value === "in-stock" || value === "sold-out"),
    sort: rawSort === "price-asc" || rawSort === "price-desc" || rawSort === "name" ? rawSort : "newest",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function catalogQueryString(query: CatalogQuery, overrides: Partial<CatalogQuery>) {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  for (const field of CATALOG_FILTER_FIELDS) {
    for (const value of next[field] as string[]) params.append(field, value);
  }
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  const value = params.toString();
  return value ? `?${value}` : "";
}

/** How many filter values are applied (search and sort not included). */
export function countActiveFilters(query: CatalogQuery) {
  return CATALOG_FILTER_FIELDS.reduce((total, field) => total + query[field].length, 0);
}

function productWhere(query: CatalogQuery, collectionSlug?: string): Prisma.ProductWhereInput {
  return {
    status: "ACTIVE",
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category.length ? { category: { slug: { in: query.category } } } : {}),
    ...(!collectionSlug && query.collection.length ? { collections: { some: { slug: { in: query.collection }, isActive: true } } } : {}),
    // Colour and size are checked on the same option, so "Burgundy" + "M" finds a burgundy piece in size M.
    ...(query.color.length || query.size.length
      ? { variants: { some: { ...(query.color.length ? { color: { in: query.color } } : {}), ...(query.size.length ? { size: { in: query.size } } : {}) } } }
      : {}),
    // Ticking both "In stock" and "Sold out" is the same as no availability filter.
    ...(query.availability.length === 1 ? { stockQuantity: query.availability[0] === "in-stock" ? { gt: 0 } : { lte: 0 } } : {}),
    ...(collectionSlug ? { collections: { some: { slug: collectionSlug, isActive: true } } } : {}),
  };
}

function productOrderBy(sort: CatalogQuery["sort"]): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { price: "asc" };
  if (sort === "price-desc") return { price: "desc" };
  if (sort === "name") return { title: "asc" };
  return { publishedAt: "desc" };
}

function mapProduct(product: {
  title: string;
  slug: string;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  stockQuantity: number;
  isSale: boolean;
  category: { name: string };
  images: { url: string; altText: string | null }[];
}): CatalogProduct {
  const primaryImage = product.images[0];
  return {
    name: product.title,
    slug: product.slug,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    badge: product.stockQuantity <= 0 ? "Sold out" : product.isSale ? "Sale" : undefined,
    image: primaryImage?.url ?? "/products/dress-mauve.svg",
    imageAlt: primaryImage?.altText ?? product.title,
    category: product.category.name,
    stockQuantity: product.stockQuantity,
  };
}

export async function getCatalog(query: CatalogQuery, collectionSlug?: string) {
  const where = productWhere(query, collectionSlug);
  const [total, rows, filters] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }], take: 1 },
      },
      orderBy: productOrderBy(query.sort),
      skip: (query.page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    getCatalogFilters(collectionSlug ?? ""),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  // Product rows stay live (prices and stock are always current); the filter lists are cached.
  return { products: rows.map(mapProduct), total, pageCount, ...filters };
}

/** Category, collection, colour and size lists for the shop filters. Cached; refreshed when the catalog changes. */
const getCatalogFilters = storefrontCache(
  async (collectionSlug: string) => {
    const [categories, collections, variants] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, select: { name: true, slug: true } }),
      prisma.productCollection.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, select: { name: true, slug: true } }),
      prisma.productVariant.findMany({
        where: { product: { status: "ACTIVE", ...(collectionSlug ? { collections: { some: { slug: collectionSlug } } } : {}) } },
        select: { color: true, colorHex: true, size: true },
      }),
    ]);
    const colors = Array.from(new Map(variants.filter((item) => item.color).map((item) => [item.color!, item.colorHex])).entries())
      .map(([name, hex]) => ({ name, hex }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const sizes = Array.from(new Set(variants.map((item) => item.size).filter((value): value is string => Boolean(value))));
    return { categories, collections, colors, sizes };
  },
  "catalog-filters",
  CATALOG_CACHE_TAG,
);

export const getCollection = cache(async (slug: string) =>
  prisma.productCollection.findFirst({ where: { slug, isActive: true } }),
);

export const getProduct = cache(async (slug: string) =>
  prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      variants: { orderBy: { displayOrder: "asc" } },
      collections: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
    },
  }),
);

/** Featured products and collections for the homepage. Cached; refreshed when the catalog or stock changes. */
export const getHomeCatalog = storefrontCache(
  async () => {
    const [products, collections] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE", isFeatured: true },
        include: { category: { select: { name: true } }, images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }], take: 1 } },
        orderBy: { publishedAt: "desc" },
        take: 4,
      }),
      prisma.productCollection.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        take: 24,
        select: { id: true, slug: true, name: true, description: true, image: true },
      }),
    ]);
    return { products: products.map(mapProduct), collections };
  },
  "home-catalog",
  CATALOG_CACHE_TAG,
);
