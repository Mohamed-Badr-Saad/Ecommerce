import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center text-primary", compact ? "gap-1.5" : "gap-3", className)}>
      <span
        aria-hidden="true"
        className={cn("relative inline-block shrink-0 font-heading", compact ? "h-9 w-7" : "h-14 w-11")}
      >
        <span className={cn("absolute left-0 top-0 leading-none", compact ? "text-4xl" : "text-6xl")}>T</span>
        <span className={cn("absolute leading-none", compact ? "left-2 top-2.5 text-3xl" : "left-3.5 top-4 text-5xl")}>L</span>
        <span className="absolute left-1/2 top-0 h-full w-px bg-brand-gold/70" />
        <span className="absolute -right-0.5 top-1 size-1 rotate-45 bg-brand-gold" />
        <span className="absolute bottom-0 left-0 size-1 rotate-45 bg-brand-gold" />
      </span>
      <span className={cn("font-heading font-semibold tracking-[-0.045em]", compact ? "text-3xl" : "text-4xl")}>
        Talié
      </span>
    </span>
  );
}
