import { z } from "zod";

import { prisma } from "./prisma";
import { storefrontImageUrlSchema } from "./media";

const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");
const optionalMoney = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().nonnegative().optional());
const optionalImage = z.preprocess((value) => value === "" || value == null ? undefined : value, storefrontImageUrlSchema.optional());

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().max(500).optional(),
  image: optionalImage,
});

export const tagInputSchema = z.object({ name: z.string().trim().min(2).max(50), slug });
export const collectionInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().max(500).optional(),
  image: optionalImage,
});

export const productInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug,
  description: z.string().trim().min(10).max(10_000),
  categoryId: z.string().min(1),
  price: z.coerce.number().positive(),
  compareAtPrice: optionalMoney,
  sku: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(80).optional()),
  stockQuantity: z.coerce.number().int().nonnegative(),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean().default(false),
});

export const variantInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(2).max(80),
  color: z.string().trim().max(60).optional(),
  colorHex: z.string().trim().regex(/^#[0-9a-f]{6}$/i).optional().or(z.literal("")),
  size: z.string().trim().max(30).optional(),
  price: optionalMoney,
  stockQuantity: z.coerce.number().int().nonnegative(),
  image: optionalImage,
});

export const productImageInputSchema = z.object({
  url: storefrontImageUrlSchema,
  altText: z.string().trim().max(180).optional(),
});

export async function getAdminCatalog() {
  const [products, categories, tags, collections] = await Promise.all([
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { name: true } }, variants: { select: { id: true, stockQuantity: true } }, images: { where: { isPrimary: true }, take: 1 } },
    }),
    prisma.category.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true, children: true } } } }),
    prisma.productTag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.productCollection.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
  ]);
  return { products, categories, tags, collections };
}

export async function getAdminProduct(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      variants: { orderBy: { displayOrder: "asc" }, include: { _count: { select: { orderItems: true } } } },
      images: { orderBy: { displayOrder: "asc" } },
      tags: { orderBy: { name: "asc" } },
      collections: { orderBy: { displayOrder: "asc" } },
      _count: { select: { orderItems: true } },
    },
  });
}

export async function createAdminProduct(input: z.input<typeof productInputSchema>) {
  const data = productInputSchema.parse(input);
  return prisma.product.create({ data: { ...data, publishedAt: data.status === "ACTIVE" ? new Date() : null, isSale: Boolean(data.compareAtPrice && data.compareAtPrice > data.price) } });
}

export async function updateAdminProduct(productId: string, input: z.input<typeof productInputSchema>) {
  const data = productInputSchema.parse(input);
  return prisma.product.update({ where: { id: productId }, data: { ...data, publishedAt: data.status === "ACTIVE" ? new Date() : null, isSale: Boolean(data.compareAtPrice && data.compareAtPrice > data.price) } });
}
