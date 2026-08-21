"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root data-slot="checkbox" className={cn("peer size-4 shrink-0 border border-input bg-background outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className)} {...props}><CheckboxPrimitive.Indicator className="flex items-center justify-center"><Check className="size-3" /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
}

export { Checkbox };
