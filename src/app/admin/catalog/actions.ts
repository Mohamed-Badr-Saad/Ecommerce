"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { categoryInputSchema, collectionInputSchema, createAdminProduct, productImageInputSchema, productInputSchema, tagInputSchema, updateAdminProduct, variantInputSchema } from "@/lib/admin-catalog";
import { logAdminActivity } from "@/lib/admin";
import { refreshCatalogCache } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";

function checked(formData: FormData, name: string) { return formData.get(name) === "on"; }

export async function createProductAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = productInputSchema.parse({ ...Object.fromEntries(formData), isFeatured: checked(formData, "isFeatured") });
  const product = await createAdminProduct(data);
  const imageUrls = formData.getAll("imageUrls").map(String).filter(Boolean);
  if (imageUrls.length) {
    const images = imageUrls.map((url) => productImageInputSchema.parse({ url, altText: product.title }));
    await prisma.productImage.createMany({ data: images.map((image, index) => ({ productId: product.id, ...image, displayOrder: index, isPrimary: index === 0 })) });
  }
  const selectedCollectionIds = formData.getAll("collectionIds").map(String).filter(Boolean);
  if (selectedCollectionIds.length) await prisma.product.update({ where: { id: product.id }, data: { collections: { connect: selectedCollectionIds.map((id) => ({ id })) } } });
  await logAdminActivity(session.user.id, { action: "created product", entityType: "product", entityId: product.id, details: { title: product.title } });
  refreshCatalogCache(); revalidatePath("/admin/catalog");
  redirect(`/admin/catalog/${product.id}`);
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = productInputSchema.parse({ ...Object.fromEntries(formData), isFeatured: checked(formData, "isFeatured") });
  const product = await updateAdminProduct(productId, data);
  await logAdminActivity(session.user.id, { action: "updated product", entityType: "product", entityId: product.id, details: { title: product.title } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop");
}

export async function archiveProductAction(productId: string) {
  const session = await requireAdminSession();
  const product = await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED", publishedAt: null } });
  await logAdminActivity(session.user.id, { action: "archived product", entityType: "product", entityId: product.id, details: { title: product.title } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop");
}

export async function deleteProductAction(productId: string) {
  const session = await requireAdminSession();
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include: { _count: { select: { orderItems: true } } } });
  if (product._count.orderItems) {
    await prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED", publishedAt: null } });
    await logAdminActivity(session.user.id, { action: "archived product with order history", entityType: "product", entityId: product.id, details: { title: product.title, orderItems: product._count.orderItems } });
  } else {
    await prisma.product.delete({ where: { id: productId } });
    await logAdminActivity(session.user.id, { action: "deleted product", entityType: "product", entityId: product.id, details: { title: product.title } });
  }
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop"); revalidatePath("/");
  redirect("/admin/catalog");
}

export async function createCategoryAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = categoryInputSchema.parse(Object.fromEntries(formData));
  const category = await prisma.category.create({ data });
  await logAdminActivity(session.user.id, { action: "created category", entityType: "category", entityId: category.id, details: { name: category.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog");
}

export async function toggleCategoryAction(categoryId: string) {
  const session = await requireAdminSession();
  const current = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });
  const category = await prisma.category.update({ where: { id: categoryId }, data: { isActive: !current.isActive } });
  await logAdminActivity(session.user.id, { action: category.isActive ? "activated category" : "deactivated category", entityType: "category", entityId: category.id });
  refreshCatalogCache(); revalidatePath("/admin/catalog");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = categoryInputSchema.parse(Object.fromEntries(formData));
  const displayOrder = Number(formData.get("displayOrder"));
  if (!Number.isInteger(displayOrder) || displayOrder < 0) throw new Error("Display order must be a non-negative whole number.");
  const category = await prisma.category.update({ where: { id: categoryId }, data: { ...data, displayOrder, isActive: checked(formData, "isActive") } });
  await logAdminActivity(session.user.id, { action: "updated category", entityType: "category", entityId: category.id, details: { name: category.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop");
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await requireAdminSession();
  const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId }, include: { _count: { select: { products: true, children: true } } } });
  if (category._count.products || category._count.children) throw new Error("Move its products and child categories before deleting this category.");
  await prisma.category.delete({ where: { id: categoryId } });
  await logAdminActivity(session.user.id, { action: "deleted category", entityType: "category", entityId: category.id, details: { name: category.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop");
}

export async function createTagAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = tagInputSchema.parse(Object.fromEntries(formData));
  const tag = await prisma.productTag.create({ data });
  await logAdminActivity(session.user.id, { action: "created tag", entityType: "tag", entityId: tag.id, details: { name: tag.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog");
}

export async function updateTagAction(tagId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = tagInputSchema.parse(Object.fromEntries(formData));
  const tag = await prisma.productTag.update({ where: { id: tagId }, data });
  await logAdminActivity(session.user.id, { action: "updated tag", entityType: "tag", entityId: tag.id, details: { name: tag.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop");
}

export async function deleteTagAction(tagId: string) {
  const session = await requireAdminSession();
  const tag = await prisma.productTag.delete({ where: { id: tagId } });
  await logAdminActivity(session.user.id, { action: "deleted tag", entityType: "tag", entityId: tag.id, details: { name: tag.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop");
}

export async function createCollectionAction(formData: FormData) {
  const session = await requireAdminSession();
  const data = collectionInputSchema.parse(Object.fromEntries(formData));
  const collection = await prisma.productCollection.create({ data });
  await logAdminActivity(session.user.id, { action: "created collection", entityType: "collection", entityId: collection.id, details: { name: collection.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog");
}

export async function updateCollectionAction(collectionId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = collectionInputSchema.parse(Object.fromEntries(formData));
  const displayOrder = Number(formData.get("displayOrder"));
  if (!Number.isInteger(displayOrder) || displayOrder < 0) throw new Error("Display order must be a non-negative whole number.");
  const collection = await prisma.productCollection.update({ where: { id: collectionId }, data: { ...data, displayOrder, isActive: checked(formData, "isActive") } });
  await logAdminActivity(session.user.id, { action: "updated collection", entityType: "collection", entityId: collection.id, details: { name: collection.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop"); revalidatePath("/"); revalidatePath("/collections/[slug]", "page");
}

export async function deleteCollectionAction(collectionId: string) {
  const session = await requireAdminSession();
  const collection = await prisma.productCollection.delete({ where: { id: collectionId } });
  await logAdminActivity(session.user.id, { action: "deleted collection", entityType: "collection", entityId: collection.id, details: { name: collection.name } });
  refreshCatalogCache(); revalidatePath("/admin/catalog"); revalidatePath("/shop"); revalidatePath("/");
}

export async function updateProductCollectionsAction(productId: string, formData: FormData) {
  const session = await requireAdminSession();
  const collectionIds = Array.from(new Set(formData.getAll("collectionIds").map(String).filter(Boolean)));
  const validCount = await prisma.productCollection.count({ where: { id: { in: collectionIds } } });
  if (validCount !== collectionIds.length) throw new Error("One or more collections are invalid.");
  await prisma.product.update({ where: { id: productId }, data: { collections: { set: collectionIds.map((id) => ({ id })) } } });
  await logAdminActivity(session.user.id, { action: "updated product collections", entityType: "product", entityId: productId, details: { collectionIds } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop"); revalidatePath("/collections/[slug]", "page");
}

export async function addVariantAction(productId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = variantInputSchema.parse(Object.fromEntries(formData));
  const variant = await prisma.productVariant.create({ data: { ...data, colorHex: data.colorHex || null, productId } });
  await logAdminActivity(session.user.id, { action: "created variant", entityType: "variant", entityId: variant.id, details: { productId, sku: variant.sku } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop");
}

export async function updateVariantStockAction(productId: string, variantId: string, formData: FormData) {
  const session = await requireAdminSession();
  const stockQuantity = Number(formData.get("stockQuantity"));
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new Error("Stock must be a non-negative whole number.");
  const variant = await prisma.productVariant.update({ where: { id: variantId, productId }, data: { stockQuantity } });
  await logAdminActivity(session.user.id, { action: "updated inventory", entityType: "variant", entityId: variant.id, details: { stockQuantity } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop");
}

export async function updateVariantAction(productId: string, variantId: string, formData: FormData) {
  const session = await requireAdminSession();
  const data = variantInputSchema.parse(Object.fromEntries(formData));
  const variant = await prisma.productVariant.update({ where: { id: variantId, productId }, data: { ...data, colorHex: data.colorHex || null } });
  await logAdminActivity(session.user.id, { action: "updated variant", entityType: "variant", entityId: variant.id, details: { productId, sku: variant.sku } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop"); revalidatePath("/products/[slug]", "page");
}

export async function deleteVariantAction(productId: string, variantId: string) {
  const session = await requireAdminSession();
  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId, productId }, include: { _count: { select: { orderItems: true } } } });
  if (variant._count.orderItems) throw new Error("A variant used in an order cannot be deleted. Set its stock to zero instead.");
  await prisma.productVariant.delete({ where: { id: variantId, productId } });
  await logAdminActivity(session.user.id, { action: "deleted variant", entityType: "variant", entityId: variant.id, details: { productId, sku: variant.sku } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop");
}

export async function addProductImageAction(productId: string, formData: FormData) {
  const session = await requireAdminSession();
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { title: true } });
  const count = await prisma.productImage.count({ where: { productId } });
  const urls = formData.getAll("url").map(String).filter(Boolean);
  const altText = String(formData.get("altText") ?? "").trim() || product.title;
  if (!urls.length) throw new Error("Upload at least one product image.");
  const images = urls.map((url) => productImageInputSchema.parse({ url, altText }));
  const created = await prisma.$transaction(images.map((image, index) => prisma.productImage.create({ data: { productId, ...image, displayOrder: count + index, isPrimary: count === 0 && index === 0 } })));
  await logAdminActivity(session.user.id, { action: "added product images", entityType: "product-image", entityId: created[0]?.id, details: { productId, count: created.length } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop");
}

export async function updateProductImageAction(productId: string, imageId: string, formData: FormData) {
  const session = await requireAdminSession();
  const altText = String(formData.get("altText") ?? "").trim();
  const displayOrder = Number(formData.get("displayOrder"));
  if (altText.length > 180) throw new Error("Alt text must be 180 characters or fewer.");
  if (!Number.isInteger(displayOrder) || displayOrder < 0) throw new Error("Display order must be a non-negative whole number.");
  const makePrimary = checked(formData, "isPrimary");
  const image = await prisma.$transaction(async (tx) => {
    await tx.productImage.findUniqueOrThrow({ where: { id: imageId, productId } });
    if (makePrimary) await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    return tx.productImage.update({ where: { id: imageId, productId }, data: { altText: altText || null, displayOrder, ...(makePrimary ? { isPrimary: true } : {}) } });
  });
  await logAdminActivity(session.user.id, { action: "updated product image", entityType: "product-image", entityId: image.id, details: { productId, displayOrder, isPrimary: image.isPrimary } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop"); revalidatePath("/products/[slug]", "page");
}

export async function deleteProductImageAction(productId: string, imageId: string) {
  const session = await requireAdminSession();
  const deleted = await prisma.$transaction(async (tx) => {
    const image = await tx.productImage.delete({ where: { id: imageId, productId } });
    if (image.isPrimary) {
      const replacement = await tx.productImage.findFirst({ where: { productId }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
      if (replacement) await tx.productImage.update({ where: { id: replacement.id }, data: { isPrimary: true } });
    }
    return image;
  });
  await logAdminActivity(session.user.id, { action: "deleted product image", entityType: "product-image", entityId: deleted.id, details: { productId } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop"); revalidatePath("/products/[slug]", "page");
}

export async function attachTagAction(productId: string, formData: FormData) {
  const session = await requireAdminSession();
  const tagId = String(formData.get("tagId") ?? "");
  await prisma.product.update({ where: { id: productId }, data: { tags: { connect: { id: tagId } } } });
  await logAdminActivity(session.user.id, { action: "tagged product", entityType: "product", entityId: productId, details: { tagId } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`);
}

export async function detachTagAction(productId: string, tagId: string) {
  const session = await requireAdminSession();
  await prisma.product.update({ where: { id: productId }, data: { tags: { disconnect: { id: tagId } } } });
  await logAdminActivity(session.user.id, { action: "removed product tag", entityType: "product", entityId: productId, details: { tagId } });
  refreshCatalogCache(); revalidatePath(`/admin/catalog/${productId}`); revalidatePath("/shop");
}
