"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Shown once, right after checkout: confirms the order and points the customer to
 * where they can follow it later. The ?placed flag is removed so a refresh doesn't repeat it.
 */
export function OrderPlacedToast({ orderNumber, addressSaved }: { orderNumber: string; addressSaved: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    toast.success(`Order ${orderNumber} placed`, {
      id: `order-placed-${orderNumber}`,
      duration: 12000,
      description: (
        <span>
          You can check its status anytime from{" "}
          <Link href="/account/orders" className="font-medium underline underline-offset-4">My orders</Link>.
          {addressSaved ? " Your address was saved for next time." : ""}
        </span>
      ),
      action: {
        label: "Order details",
        onClick: () => document.getElementById("order-details")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      },
    });
    router.replace(pathname, { scroll: false });
  }, [orderNumber, addressSaved, pathname, router]);

  return null;
}
