import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomeCatalog } from "@/lib/catalog";

export default async function Home() {
  const { collections, products } = await getHomeCatalog();
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-[1600px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center bg-secondary px-6 py-16 sm:px-10 lg:px-16 xl:px-24">
          <div className="max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-burgundy/75">
              The debut edit · 2026
            </p>
            <h1 className="font-heading text-5xl leading-[0.94] tracking-[-0.055em] text-balance sm:text-6xl xl:text-8xl">
              Modesty,
              <br />
              made modern.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              Thoughtfully cut layers, effortless silhouettes, and elevated
              essentials crafted for the modern hijabi.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-none px-7">
                <Link href="/shop?sort=newest">Shop new arrivals</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-none border-primary/25 bg-transparent px-7"
              >
                <Link href="/collections/debut-edit">Explore the edit</Link>
              </Button>
            </div>
            <div className="mt-12 grid max-w-md grid-cols-3 gap-5 border-t border-primary/15 pt-6 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span>Made to layer</span>
              <span>Egypt-wide delivery</span>
              <span>Easy returns</span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[34rem] overflow-hidden bg-muted lg:min-h-full">
          <Image
            src="/editorial/hero.svg"
            alt="Hijabi model in a modern monochrome look"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />
          <p className="absolute bottom-7 left-7 text-xs font-medium uppercase tracking-[0.2em] text-white sm:bottom-10 sm:left-10">
            The everyday layer · Look 01
          </p>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading
          eyebrow="Shop by mood"
          title="Designed around your day"
          description="A considered wardrobe of pieces that move easily from early mornings to late evenings."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {collections.map((collection, index) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className={`group relative overflow-hidden bg-muted ${index === 1 ? "md:mt-10" : ""}`}
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={collection.image ?? "/editorial/hero.svg"}
                  alt={`${collection.name} collection`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                  {index === 0 ? "Soft structure" : index === 1 ? "Quietly elevated" : "Made to move"}
                </p>
                <h2 className="mt-2 font-heading text-3xl tracking-tight">
                  {collection.name}
                </h2>
                <span className="mt-4 inline-block border-b border-white pb-1 text-sm">
                  Discover the collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="new-arrivals" className="bg-secondary/55">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals"
            description="Quiet statement pieces in an easy, layer-ready palette."
            action={{ label: "View the full edit", href: "/shop" }}
          />
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <div className="relative min-h-[28rem] bg-muted lg:min-h-[38rem]">
          <Image
            src="/editorial/story.svg"
            alt="Woman in a green headscarf styled for everyday wear"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex items-center bg-primary px-6 py-16 text-primary-foreground sm:px-12 lg:px-20">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/60">
              The Talié point of view
            </p>
            <h2 className="mt-5 font-heading text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
              Less noise. More intention.
            </h2>
            <p className="mt-6 text-base leading-7 text-primary-foreground/70">
              We design pieces that honor modesty without compromising
              expression—refined proportions, comfortable fabrics, and details
              that feel special long after the first wear.
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-9 h-12 rounded-none border-primary-foreground/30 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link href="#newsletter">Follow our story</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="newsletter" className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Notes from Talié
          </p>
          <h2 className="mt-4 font-heading text-4xl tracking-tight sm:text-5xl">
            Join our inner circle
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
            Be first to discover new edits, styling notes, and private offers.
          </p>
          <form className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              name="email"
              aria-label="Email address"
              placeholder="Your email address"
              className="h-12 rounded-none bg-background px-4"
              required
            />
            <Button type="submit" className="h-12 rounded-none px-8">
              Subscribe
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Newsletter delivery will be connected in a later content chunk.
          </p>
        </div>
      </section>
    </main>
  );
}
