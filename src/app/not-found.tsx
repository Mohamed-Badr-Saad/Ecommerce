import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65svh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">404 · Not found</p>
      <h1 className="mt-5 font-heading text-5xl tracking-tight sm:text-6xl">This piece has moved.</h1>
      <p className="mt-5 max-w-md leading-7 text-muted-foreground">
        The page you are looking for is no longer here, or its address has changed.
      </p>
      <Button asChild size="lg" className="mt-8 h-12 rounded-none px-8">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
