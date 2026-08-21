"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[65svh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Something went wrong</p>
      <h1 className="mt-5 font-heading text-5xl tracking-tight sm:text-6xl">Let’s try that again.</h1>
      <p className="mt-5 max-w-md leading-7 text-muted-foreground">
        We could not load this part of Talié. Your information is safe, and you can retry now.
      </p>
      <Button type="button" size="lg" className="mt-8 h-12 rounded-none px-8" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
