import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminProduct, getAdminProduct, updateAdminProduct } from "./admin-catalog";
import { prisma } from "./prisma";

const suffix = crypto.randomUUID().slice(0, 8);
const slug = `catalog-admin-test-${suffix}`;
let categoryId = "";
let productId = "";

describe("admin catalog CRUD", () => {
  beforeAll(async () => {
    const category = await prisma.category.findFirstOrThrow({ where: { isActive: true } });
    categoryId = category.id;
  });

  afterAll(async () => {
    if (productId) await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it("creates a validated draft and publishes updates", async () => {
    const product = await createAdminProduct({ title: "Catalog Admin Test", slug, description: "A sufficiently detailed product description for the CRUD test.", categoryId, price: 900, compareAtPrice: 1100, sku: `TEST-${suffix}`, stockQuantity: 4, lowStockThreshold: 2, status: "DRAFT", isFeatured: false });
    productId = product.id;
    expect(product.status).toBe("DRAFT");
    expect(product.isSale).toBe(true);

    const updated = await updateAdminProduct(product.id, { title: product.title, slug, description: product.description, categoryId, price: 900, compareAtPrice: "", sku: product.sku ?? undefined, stockQuantity: 7, lowStockThreshold: 2, status: "ACTIVE", isFeatured: true });
    expect(updated.status).toBe("ACTIVE");
    expect(updated.publishedAt).toBeInstanceOf(Date);
    expect(updated.isSale).toBe(false);
  });

  it("persists variant inventory, media associations, and tags", async () => {
    const tag = await prisma.productTag.upsert({ where: { slug: `test-${suffix}` }, update: {}, create: { name: `Test ${suffix}`, slug: `test-${suffix}` } });
    const collection = await prisma.productCollection.findUniqueOrThrow({ where: { slug: "debut-edit" } });
    await prisma.product.update({ where: { id: productId }, data: { variants: { create: { title: "Burgundy / M", sku: `TEST-${suffix}-M`, color: "Burgundy", size: "M", stockQuantity: 3 } }, images: { create: { url: "/products/set-oxblood.svg", altText: "Test set", isPrimary: true } }, tags: { connect: { id: tag.id } }, collections: { connect: { id: collection.id } } } });
    const product = await getAdminProduct(productId);
    expect(product?.variants[0]?.stockQuantity).toBe(3);
    expect(product?.images[0]?.isPrimary).toBe(true);
    expect(product?.tags.map((item) => item.id)).toContain(tag.id);
    expect(product?.collections.map((item) => item.id)).toContain(collection.id);
    await prisma.productTag.delete({ where: { id: tag.id } });
  });
});
