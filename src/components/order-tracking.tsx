import { Check, ExternalLink, Truck } from "lucide-react";

import { Button } from "./ui/button";

type TrackableOrder = {
  status: string;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

const dateFormat = new Intl.DateTimeFormat("en-EG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Cairo" });

/** Only plain web links are shown to customers. */
export function safeTrackingUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Delivery progress plus the courier tracking number/link the admin added when shipping. */
export function OrderTracking({ order }: { order: TrackableOrder }) {
  if (order.status === "CANCELLED" || order.status === "REFUNDED") return null;
  const preparing = ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);
  const shipped = ["SHIPPED", "DELIVERED"].includes(order.status);
  const delivered = order.status === "DELIVERED";
  const steps = [
    { label: "Order placed", done: true, date: order.createdAt },
    { label: "Being prepared", done: preparing, date: null },
    { label: "On its way", done: shipped, date: order.shippedAt },
    { label: "Delivered", done: delivered, date: order.deliveredAt },
  ];
  const trackingUrl = safeTrackingUrl(order.trackingUrl);

  return (
    <section aria-label="Delivery progress" className="mt-10 border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3"><Truck className="size-5 text-primary" aria-hidden="true" /><h2 className="font-heading text-3xl">Delivery</h2></div>
      <ol className="mt-6 grid gap-4 [print-color-adjust:exact] sm:grid-cols-4 sm:gap-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${step.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
              {step.done ? <Check className="size-3.5" aria-hidden="true" /> : null}
            </span>
            <span className="text-sm">
              <span className={step.done ? "font-medium" : "text-muted-foreground"}>{step.label}</span>
              {step.done && step.date ? <span className="block text-xs text-muted-foreground">{dateFormat.format(step.date)}</span> : null}
              <span className="sr-only">{step.done ? " (done)" : " (not yet)"}</span>
            </span>
          </li>
        ))}
      </ol>
      {order.trackingNumber ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tracking number</p>
            <p className="mt-1 select-all font-medium">{order.trackingNumber}</p>
          </div>
          {trackingUrl ? (
            <Button asChild variant="outline" className="h-11 rounded-none print:hidden">
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">Track your parcel<ExternalLink aria-hidden="true" /></a>
            </Button>
          ) : null}
        </div>
      ) : shipped ? null : (
        <p className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">You’ll see your tracking number here once your order ships.</p>
      )}
    </section>
  );
}
