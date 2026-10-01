import Image from "next/image";
import Link from "next/link";

import { CollectionsSlider } from "@/components/collections-slider";
import { CustomerFeedbackWall } from "@/components/customer-feedback-wall";
import { FeedbackForm } from "@/components/feedback-form";
import { ProductCard } from "@/components/product-card";
import { HomepageBanner } from "@/components/homepage-banner";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { getHomeCatalog } from "@/lib/catalog";
import { getActiveBanners, getActiveCustomerFeedback } from "@/lib/admin-content";

export default async function Home() {
  const [{ collections, products }, banners, feedback] = await Promise.all([getHomeCatalog(), getActiveBanners(), getActiveCustomerFeedback()]);
  return (
    <main>
      {banners.length ? <HomepageBanner banners={banners} /> : <section className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-[1600px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center bg-secondary px-6 py-16 sm:px-10 lg:px-16 xl:px-24">
          <div className="max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-burgundy/75">
              New collection · 2026
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
                <Link href="/collections/debut-edit">Explore the collection</Link>
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
      </section>}

      {collections.length ? <section id="collections" className="mx-auto max-w-[1600px] py-20 lg:py-28">
        <div className="px-5 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Shop by mood"
            title="Designed around your day"
            description="A considered wardrobe of pieces that move easily from early mornings to late evenings."
          />
        </div>
        <CollectionsSlider
          collections={collections.map(({ id, slug, name, description, image }) => ({ id, slug, name, description, image }))}
        />
      </section> : null}

      <section id="new-arrivals" className="bg-secondary/55">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals"
            description="Quiet statement pieces in an easy, layer-ready palette."
            action={{ label: "View all products", href: "/shop" }}
          />
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <CustomerFeedbackWall feedback={feedback} />

      <section id="feedback" className="mx-auto grid max-w-[1600px] border-b border-border lg:grid-cols-2">
        <div className="relative flex flex-col overflow-hidden bg-primary lg:min-h-[44rem]">
          {/* Phones: photo on top, text below. Larger screens: text over the photo. */}
          <div className="relative h-72 sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
            <Image
              src="/editorial/story.svg"
              alt="Woman in a green headscarf styled for everyday wear"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-bottom"
            />
          </div>
          <div className="absolute inset-0 hidden bg-linear-to-t from-primary via-primary/55 to-transparent lg:block" />
          <div className="relative px-6 py-10 text-primary-foreground sm:px-12 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-16 lg:pb-16 lg:pt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/70">
              The Talié point of view
            </p>
            <h2 className="mt-4 font-heading text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
              Less noise. More intention.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-primary-foreground/80">
              We design pieces that honour modesty without compromising
              expression: flattering cuts, comfortable fabrics, and details
              that feel special long after the first wear.
            </p>
            {feedback.length ? (
              <Link href="#customer-love" className="mt-6 inline-block border-b border-primary-foreground/60 pb-1 text-sm hover:border-primary-foreground">
                Read customer reviews
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex items-center bg-secondary/40 px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
          <div className="mx-auto w-full max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Notes for Talié
            </p>
            <h2 className="mt-4 font-heading text-4xl tracking-tight sm:text-5xl">
              Share your feedback
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-7 text-muted-foreground">
              Tell us how your pieces fit, feel, and arrived. Every note helps us make our next collection even better.
            </p>
            <FeedbackForm />
          </div>
        </div>
      </section>
    </main>
  );
}
