import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main aria-label="Loading storefront" aria-busy="true">
      <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-[1600px] lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-5 bg-secondary px-6 py-16 sm:px-10 lg:px-20">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-20 w-full max-w-lg" />
          <Skeleton className="h-6 w-full max-w-md" />
          <Skeleton className="h-12 w-44" />
        </div>
        <Skeleton className="min-h-[34rem] rounded-none" />
      </div>
    </main>
  );
}
