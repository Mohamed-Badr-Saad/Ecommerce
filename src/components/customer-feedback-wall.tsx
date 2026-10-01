import Image from "next/image";
import { Quote } from "lucide-react";

import { SectionHeading } from "./section-heading";

type FeedbackItem = {
  id: string;
  image: string;
  imageWidth: number | null;
  imageHeight: number | null;
  altText: string | null;
  customerName: string | null;
  caption: string | null;
};

export function CustomerFeedbackWall({ feedback }: { feedback: FeedbackItem[] }) {
  if (!feedback.length) return null;
  return (
    <section id="customer-love" className="border-b border-border">
      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading
          eyebrow="Customer love"
          title="In their words"
          description="Messages and reviews shared with us by the women who wear Talié."
        />
        <ul className="mt-10 columns-2 gap-3 sm:gap-5 md:columns-3 xl:columns-4">
          {feedback.map((item) => (
            <li key={item.id} className="mb-3 break-inside-avoid sm:mb-5">
              <figure className="border border-border bg-card p-2 sm:p-3">
                <a href={item.image} target="_blank" rel="noreferrer" className="block overflow-hidden bg-muted" aria-label={`Open ${item.customerName ? `${item.customerName}’s` : "customer"} feedback full size`}>
                  <Image
                    src={item.image}
                    alt={item.altText ?? (item.customerName ? `Feedback from ${item.customerName}` : "Customer feedback screenshot")}
                    width={item.imageWidth ?? 900}
                    height={item.imageHeight ?? 1600}
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
                    className="h-auto w-full transition duration-500 hover:scale-[1.02]"
                  />
                </a>
                {item.caption || item.customerName ? (
                  <figcaption className="px-1 pb-1 pt-3 text-sm leading-6">
                    {item.caption ? <p className="flex gap-2 text-foreground/85"><Quote className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden="true" />{item.caption}</p> : null}
                    {item.customerName ? <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">— {item.customerName}</p> : null}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
