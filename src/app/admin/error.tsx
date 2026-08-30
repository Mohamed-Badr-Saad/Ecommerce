"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="flex min-h-[55vh] flex-col items-center justify-center border border-border bg-card px-6 text-center"><AlertTriangle className="size-9 text-destructive" aria-hidden="true" /><h2 className="mt-5 font-heading text-4xl">Dashboard unavailable</h2><p className="mt-3 max-w-md text-muted-foreground">The admin data could not be loaded. No store data was changed.</p><Button type="button" onClick={reset} className="mt-7 rounded-none">Try again</Button></section>;
}
