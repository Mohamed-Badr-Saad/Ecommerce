import { cache } from "react";

import { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

export const CATALOG_PAGE_SIZE = 8;

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export type CatalogQuery = {
  q?: string;
  collection?: string;
  category?: string;
  color?: string;
  size?: string;
  availability?: "in-stock" | "sold-out";
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

export function parseCatalogQuery(params: CatalogSearchParams): CatalogQuery {
  const rawSort = first(params.sort);
  const rawPage = Number.parseInt(first(params.page) ?? "1", 10);
  const availability = first(params.availability);

  return {
    q: first(params.q)?.trim().slice(0, 80) || undefined,
    collection: first(params.collection)?.trim() || undefined,
    category: first(params.category)?.trim() || undefined,
    color: first(params.color)?.trim() || undefined,
    size: first(params.size)?.trim() || undefined,
    availability: availability === "sold-out" ? "sold-out" : availability === "in-stock" ? "in-stock" : undefined,
    sort: rawSort === "price-asc" || rawSort === "price-desc" || rawSort === "name" ? rawSort : "newest",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function catalogQueryString(query: CatalogQuery, overrides: Partial<CatalogQuery>) {
  const next = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.collection) params.set("collection", next.collection);
  if (next.category) params.set("category", next.category);
  if (next.color) params.set("color", next.color);
  if (next.size) params.set("size", next.size);
  if (next.availability) params.set("availability", next.availability);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  const value = params.toString();
  return value ? `?${value}` : "";
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
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(!collectionSlug && query.collection ? { collections: { some: { slug: query.collection, isActive: true } } } : {}),
    ...(query.color ? { variants: { some: { color: query.color } } } : {}),
    ...(query.size ? { variants: { some: { size: query.size } } } : {}),
    ...(query.availability === "in-stock" ? { stockQuantity: { gt: 0 } } : {}),
    ...(query.availability === "sold-out" ? { stockQuantity: { lte: 0 } } : {}),
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
  const [total, rows, categories, collections, variants] = await Promise.all([
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
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  return { products: rows.map(mapProduct), total, pageCount, categories, collections, colors, sizes };
}

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

export async function getHomeCatalog() {
  const [products, collections] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", isFeatured: true },
      include: { category: { select: { name: true } }, images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }], take: 1 } },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.productCollection.findMany({ where: { isActive: true, slug: { not: "debut-edit" } }, orderBy: { displayOrder: "asc" }, take: 3 }),
  ]);
  return { products: products.map(mapProduct), collections };
}
