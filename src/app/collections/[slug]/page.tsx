import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogPage } from "@/components/catalog-page";
import { getCollection, parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return { title: collection.name, description: collection.description ?? `Shop the ${collection.name} collection from Talié.` };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const query = parseCatalogQuery(rawQuery);
  const pathname = `/collections/${collection.slug}`;
  return (
    <main>
      <header className="border-b border-border bg-secondary/70">
        <div className="mx-auto max-w-[1600px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Talié collection</p>
          <h1 className="mt-4 max-w-4xl font-heading text-5xl leading-none tracking-[-0.04em] sm:text-7xl">{collection.name}</h1>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">{collection.description}</p>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <CatalogPage query={query} pathname={pathname} collectionSlug={collection.slug} />
      </div>
    </main>
  );
}
