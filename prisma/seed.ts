import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categories = [
  {
    name: "Abayas",
    slug: "abayas",
    description: "Fluid, layer-ready silhouettes for everyday and occasion wear.",
    displayOrder: 1,
  },
  {
    name: "Sets",
    slug: "sets",
    description: "Coordinated modest separates designed to move together.",
    displayOrder: 2,
  },
  {
    name: "Dresses",
    slug: "dresses",
    description: "Full-length dresses with considered proportions and coverage.",
    displayOrder: 3,
  },
] as const;

const products = [
  {
    title: "Safa Draped Abaya",
    slug: "safa-draped-abaya",
    description: "A softly structured open abaya with an easy drape and clean finish.",
    categorySlug: "abayas",
    price: "2190.00",
    sku: "TAL-SAF-BASE",
    stockQuantity: 24,
    isFeatured: true,
    image: "/products/abaya-oxblood.svg",
    variants: [
      { title: "Oxblood / S", color: "Oxblood", colorHex: "#5F0B18", size: "S", sku: "TAL-SAF-OXB-S", stockQuantity: 6 },
      { title: "Oxblood / M", color: "Oxblood", colorHex: "#5F0B18", size: "M", sku: "TAL-SAF-OXB-M", stockQuantity: 8 },
      { title: "Porcelain / M", color: "Porcelain", colorHex: "#F8EEE2", size: "M", sku: "TAL-SAF-POR-M", stockQuantity: 5 },
    ],
  },
  {
    title: "Noor Pleated Set",
    slug: "noor-pleated-set",
    description: "A relaxed two-piece set with soft pleating and an elongated line.",
    categorySlug: "sets",
    price: "1850.00",
    sku: "TAL-NOR-BASE",
    stockQuantity: 18,
    isFeatured: true,
    image: "/products/set-oxblood.svg",
    variants: [
      { title: "Burgundy / S", color: "Burgundy", colorHex: "#681321", size: "S", sku: "TAL-NOR-BUR-S", stockQuantity: 5 },
      { title: "Burgundy / M", color: "Burgundy", colorHex: "#681321", size: "M", sku: "TAL-NOR-BUR-M", stockQuantity: 7 },
      { title: "Taupe / M", color: "Taupe", colorHex: "#8A7771", size: "M", sku: "TAL-NOR-TAU-M", stockQuantity: 6 },
    ],
  },
  {
    title: "Lina Textured Kimono",
    slug: "lina-textured-kimono",
    description: "A lightweight textured outer layer finished with wide sleeves.",
    categorySlug: "abayas",
    price: "1690.00",
    compareAtPrice: "1990.00",
    sku: "TAL-LIN-BASE",
    stockQuantity: 12,
    isFeatured: true,
    image: "/products/abaya-porcelain.svg",
    variants: [
      { title: "Black / S-M", color: "Black", colorHex: "#171214", size: "S-M", sku: "TAL-LIN-BLK-SM", stockQuantity: 6 },
      { title: "Black / L-XL", color: "Black", colorHex: "#171214", size: "L-XL", sku: "TAL-LIN-BLK-LX", stockQuantity: 6 },
    ],
  },
  {
    title: "Mira Everyday Dress",
    slug: "mira-everyday-dress",
    description: "An uncomplicated full-length dress cut for comfortable everyday layering.",
    categorySlug: "dresses",
    price: "1490.00",
    sku: "TAL-MIR-BASE",
    stockQuantity: 20,
    isFeatured: true,
    image: "/products/dress-mauve.svg",
    variants: [
      { title: "Dusty Rose / S", color: "Dusty Rose", colorHex: "#B58A8C", size: "S", sku: "TAL-MIR-ROS-S", stockQuantity: 6 },
      { title: "Dusty Rose / M", color: "Dusty Rose", colorHex: "#B58A8C", size: "M", sku: "TAL-MIR-ROS-M", stockQuantity: 8 },
      { title: "Dusty Rose / L", color: "Dusty Rose", colorHex: "#B58A8C", size: "L", sku: "TAL-MIR-ROS-L", stockQuantity: 6 },
    ],
  },
  {
    title: "Aya Belted Abaya",
    slug: "aya-belted-abaya",
    description: "A polished closed abaya with a removable tie belt and fluid sleeves.",
    categorySlug: "abayas",
    price: "2390.00",
    sku: "TAL-AYA-BASE",
    stockQuantity: 14,
    isFeatured: false,
    image: "/products/abaya-oxblood.svg",
    variants: [
      { title: "Mocha / S", color: "Mocha", colorHex: "#75584B", size: "S", sku: "TAL-AYA-MOC-S", stockQuantity: 4 },
      { title: "Mocha / M", color: "Mocha", colorHex: "#75584B", size: "M", sku: "TAL-AYA-MOC-M", stockQuantity: 6 },
      { title: "Black / L", color: "Black", colorHex: "#171214", size: "L", sku: "TAL-AYA-BLK-L", stockQuantity: 4 },
    ],
  },
  {
    title: "Rana Relaxed Co-ord",
    slug: "rana-relaxed-co-ord",
    description: "A longline shirt and wide-leg trouser pairing for unhurried days.",
    categorySlug: "sets",
    price: "1790.00",
    compareAtPrice: "2050.00",
    sku: "TAL-RAN-BASE",
    stockQuantity: 9,
    isFeatured: false,
    image: "/products/set-olive.svg",
    variants: [
      { title: "Olive / S", color: "Olive", colorHex: "#77745A", size: "S", sku: "TAL-RAN-OLI-S", stockQuantity: 3 },
      { title: "Olive / M", color: "Olive", colorHex: "#77745A", size: "M", sku: "TAL-RAN-OLI-M", stockQuantity: 4 },
      { title: "Olive / L", color: "Olive", colorHex: "#77745A", size: "L", sku: "TAL-RAN-OLI-L", stockQuantity: 2 },
    ],
  },
  {
    title: "Yasmin Column Dress",
    slug: "yasmin-column-dress",
    description: "A clean column silhouette with a high neckline and subtle cuff detail.",
    categorySlug: "dresses",
    price: "1650.00",
    sku: "TAL-YAS-BASE",
    stockQuantity: 7,
    isFeatured: false,
    image: "/products/dress-stone.svg",
    variants: [
      { title: "Stone / S", color: "Stone", colorHex: "#B6A89C", size: "S", sku: "TAL-YAS-STO-S", stockQuantity: 3 },
      { title: "Stone / M", color: "Stone", colorHex: "#B6A89C", size: "M", sku: "TAL-YAS-STO-M", stockQuantity: 3 },
      { title: "Stone / L", color: "Stone", colorHex: "#B6A89C", size: "L", sku: "TAL-YAS-STO-L", stockQuantity: 1 },
    ],
  },
  {
    title: "Salma Satin Set",
    slug: "salma-satin-set",
    description: "A softly lustrous tunic and trouser set for intimate celebrations.",
    categorySlug: "sets",
    price: "2590.00",
    sku: "TAL-SAL-BASE",
    stockQuantity: 5,
    isFeatured: true,
    image: "/products/set-oxblood.svg",
    variants: [
      { title: "Oxblood / S", color: "Oxblood", colorHex: "#5F0B18", size: "S", sku: "TAL-SAL-OXB-S", stockQuantity: 2 },
      { title: "Oxblood / M", color: "Oxblood", colorHex: "#5F0B18", size: "M", sku: "TAL-SAL-OXB-M", stockQuantity: 2 },
      { title: "Oxblood / L", color: "Oxblood", colorHex: "#5F0B18", size: "L", sku: "TAL-SAL-OXB-L", stockQuantity: 1 },
    ],
  },
  {
    title: "Dalia Soft Trench",
    slug: "dalia-soft-trench",
    description: "An unlined modest trench with generous volume and antique-gold hardware.",
    categorySlug: "abayas",
    price: "2750.00",
    sku: "TAL-DAL-BASE",
    stockQuantity: 8,
    isFeatured: false,
    image: "/products/abaya-porcelain.svg",
    variants: [
      { title: "Porcelain / S-M", color: "Porcelain", colorHex: "#F8EEE2", size: "S-M", sku: "TAL-DAL-POR-SM", stockQuantity: 5 },
      { title: "Porcelain / L-XL", color: "Porcelain", colorHex: "#F8EEE2", size: "L-XL", sku: "TAL-DAL-POR-LX", stockQuantity: 3 },
    ],
  },
  {
    title: "Hana Gathered Dress",
    slug: "hana-gathered-dress",
    description: "A gathered waist, soft volume, and graceful movement in a day-to-evening dress.",
    categorySlug: "dresses",
    price: "1890.00",
    sku: "TAL-HAN-BASE",
    stockQuantity: 0,
    isFeatured: false,
    image: "/products/dress-mauve.svg",
    variants: [
      { title: "Mauve / S", color: "Mauve", colorHex: "#8B6A72", size: "S", sku: "TAL-HAN-MAU-S", stockQuantity: 0 },
      { title: "Mauve / M", color: "Mauve", colorHex: "#8B6A72", size: "M", sku: "TAL-HAN-MAU-M", stockQuantity: 0 },
    ],
  },
  {
    title: "Farah Layering Set",
    slug: "farah-layering-set",
    description: "Three easy pieces designed to layer together or work across your wardrobe.",
    categorySlug: "sets",
    price: "2290.00",
    sku: "TAL-FAR-BASE",
    stockQuantity: 11,
    isFeatured: false,
    image: "/products/set-olive.svg",
    variants: [
      { title: "Taupe / S", color: "Taupe", colorHex: "#8A7771", size: "S", sku: "TAL-FAR-TAU-S", stockQuantity: 4 },
      { title: "Taupe / M", color: "Taupe", colorHex: "#8A7771", size: "M", sku: "TAL-FAR-TAU-M", stockQuantity: 4 },
      { title: "Taupe / L", color: "Taupe", colorHex: "#8A7771", size: "L", sku: "TAL-FAR-TAU-L", stockQuantity: 3 },
    ],
  },
  {
    title: "Leila Evening Abaya",
    slug: "leila-evening-abaya",
    description: "A sweeping evening abaya with tonal embroidery and a quiet sheen.",
    categorySlug: "abayas",
    price: "3190.00",
    sku: "TAL-LEI-BASE",
    stockQuantity: 4,
    isFeatured: true,
    image: "/products/abaya-oxblood.svg",
    variants: [
      { title: "Black / S-M", color: "Black", colorHex: "#171214", size: "S-M", sku: "TAL-LEI-BLK-SM", stockQuantity: 2 },
      { title: "Black / L-XL", color: "Black", colorHex: "#171214", size: "L-XL", sku: "TAL-LEI-BLK-LX", stockQuantity: 2 },
    ],
  },
] as const;

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryIds.set(category.slug, saved.id);
  }

  const collectionDefinitions = [
    { name: "The Debut Edit", slug: "debut-edit", description: "Talié's opening edit of modern modest essentials.", image: "/editorial/hero.svg", displayOrder: 1 },
    { name: "Everyday Layers", slug: "everyday-layers", description: "Soft structure and versatile pieces designed for daily layering.", image: "/products/abaya-porcelain.svg", displayOrder: 2 },
    { name: "Occasion Edit", slug: "occasion-edit", description: "Quietly elevated silhouettes for meaningful moments.", image: "/products/dress-mauve.svg", displayOrder: 3 },
    { name: "Essential Sets", slug: "essential-sets", description: "Coordinated separates designed to move together.", image: "/products/set-oxblood.svg", displayOrder: 4 },
  ] as const;
  const collections = new Map<string, string>();

  for (const definition of collectionDefinitions) {
    const saved = await prisma.productCollection.upsert({
      where: { slug: definition.slug },
      update: { ...definition, isActive: true },
      create: { ...definition, isActive: true },
    });
    collections.set(saved.slug, saved.id);
  }

  const newArrivalTag = await prisma.productTag.upsert({
    where: { slug: "new-arrival" },
    update: { name: "New arrival" },
    create: { name: "New arrival", slug: "new-arrival" },
  });

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) throw new Error(`Missing seed category: ${product.categorySlug}`);

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        compareAtPrice: "compareAtPrice" in product ? product.compareAtPrice : null,
        categoryId,
        stockQuantity: product.stockQuantity,
        status: "ACTIVE",
        isFeatured: product.isFeatured,
        isSale: "compareAtPrice" in product,
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        collections: {
          connect: [
            { id: collections.get("debut-edit")! },
            { id: collections.get(product.categorySlug === "sets" ? "essential-sets" : product.categorySlug === "dresses" ? "occasion-edit" : "everyday-layers")! },
          ],
        },
        tags: { connect: { id: newArrivalTag.id } },
      },
      create: {
        title: product.title,
        slug: product.slug,
        description: product.description,
        price: product.price,
        compareAtPrice: "compareAtPrice" in product ? product.compareAtPrice : null,
        categoryId,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        status: "ACTIVE",
        isFeatured: product.isFeatured,
        isSale: "compareAtPrice" in product,
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        variants: {
          create: [...product.variants],
        },
        collections: {
          connect: [
            { id: collections.get("debut-edit")! },
            { id: collections.get(product.categorySlug === "sets" ? "essential-sets" : product.categorySlug === "dresses" ? "occasion-edit" : "everyday-layers")! },
          ],
        },
        tags: { connect: { id: newArrivalTag.id } },
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
    await prisma.productImage.create({
      data: { productId: savedProduct.id, url: product.image, altText: product.title, isPrimary: true },
    });
  }

  await prisma.banner.upsert({
    where: { id: "seed-home-hero" },
    update: {
      title: "Modesty, made modern.",
      isActive: true,
    },
    create: {
      id: "seed-home-hero",
      title: "Modesty, made modern.",
      subtitle: "Crafted for the modern hijabi.",
      image: "https://images.unsplash.com/photo-1552874869-5c39ec9288dc?auto=format&fit=crop&w=1600&q=90",
      ctaText: "Shop new arrivals",
      ctaLink: "/collections/debut-edit",
      isActive: true,
    },
  });

  const policies = [
    ["SHIPPING", "Shipping Policy"],
    ["REFUND", "Refund Policy"],
    ["TERMS", "Terms of Service"],
    ["PRIVACY", "Privacy Policy"],
    ["CONTACT", "Contact Talié"],
  ] as const;

  for (const [type, title] of policies) {
    await prisma.policyPage.upsert({
      where: { type },
      update: { title },
      create: {
        type,
        title,
        content: `${title} content will be finalized before launch.`,
      },
    });
  }

  await prisma.storeSettings.upsert({
    where: { key: "brand" },
    update: {
      value: { name: "Talié", tagline: "Crafted for the Modern Hijabi", currency: "EGP" },
    },
    create: {
      key: "brand",
      value: { name: "Talié", tagline: "Crafted for the Modern Hijabi", currency: "EGP" },
      description: "Public brand identity and default currency.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.info("Talié seed completed.");
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
