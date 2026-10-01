"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Site-wide toast host, styled with the Talié design tokens. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      // Bottom placement keeps toasts clear of the sticky header on every screen size.
      position="bottom-right"
      offset={24}
      mobileOffset={16}
      duration={3500}
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-none !border !border-border !bg-card !text-foreground !shadow-lg !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-xs !text-muted-foreground",
          actionButton: "!rounded-none !bg-primary !text-primary-foreground !text-xs !font-medium",
          closeButton: "!border-border !bg-card !text-muted-foreground",
          success: "[&_[data-icon]]:!text-primary",
          error: "[&_[data-icon]]:!text-destructive",
        },
      }}
      {...props}
    />
  );
}
