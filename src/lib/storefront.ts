export type StorefrontProduct = {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  image: string;
  imageAlt: string;
};

export const collections = [
  {
    name: "Everyday Layers",
    slug: "everyday-layers",
    kicker: "Soft structure",
    image: "https://images.unsplash.com/photo-1561442748-c50715dc32f6?auto=format&fit=crop&w=1100&q=85",
    imageAlt: "Woman wearing a beige abaya and black hijab",
  },
  {
    name: "Occasion Edit",
    slug: "occasion-edit",
    kicker: "Quietly elevated",
    image: "https://images.unsplash.com/photo-1652473291442-7a2e034a00d1?auto=format&fit=crop&w=1100&q=85",
    imageAlt: "Modest white coat and scarf styled for an occasion",
  },
  {
    name: "Essential Sets",
    slug: "essential-sets",
    kicker: "Made to move",
    image: "https://images.unsplash.com/photo-1681152299027-17efe7da7081?auto=format&fit=crop&w=1100&q=85",
    imageAlt: "Hijabi woman holding a flower in a soft-toned look",
  },
] as const;

export const featuredProducts: StorefrontProduct[] = [
  {
    name: "Safa Draped Abaya",
    slug: "safa-draped-abaya",
    price: 2190,
    badge: "New",
    image: "https://images.unsplash.com/photo-1613447895817-e617a4093f50?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Woman in a brown hijab and layered denim look",
  },
  {
    name: "Noor Pleated Set",
    slug: "noor-pleated-set",
    price: 1850,
    image: "https://images.unsplash.com/photo-1574297500578-afae55026ff3?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Hijabi woman in a layered maroon look",
  },
  {
    name: "Lina Textured Kimono",
    slug: "lina-textured-kimono",
    price: 1690,
    compareAtPrice: 1990,
    badge: "Limited",
    image: "https://images.unsplash.com/photo-1613611927458-3ddd4b0afdb9?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Woman in a white hijab and black layered outfit",
  },
  {
    name: "Mira Everyday Dress",
    slug: "mira-everyday-dress",
    price: 1490,
    image: "https://images.unsplash.com/photo-1746366618640-9b0257c3cd64?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Smiling hijabi woman in a modern everyday look",
  },
];

export function formatEgp(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}
