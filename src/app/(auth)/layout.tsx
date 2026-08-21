import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[calc(100svh-7rem)] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-16 sm:px-10">{children}</section>
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:items-end lg:p-16">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_25%_25%,var(--brand-gold)_0,transparent_35%),radial-gradient(circle_at_75%_70%,var(--brand-porcelain)_0,transparent_32%)]" />
        <div className="relative max-w-lg"><BrandLogo className="[&_span]:text-primary-foreground" /><p className="mt-8 font-heading text-5xl leading-tight">Your considered wardrobe, kept close.</p><p className="mt-5 leading-7 text-primary-foreground/70">Save pieces, manage delivery details, and follow every Talié order from one quiet space.</p></div>
      </aside>
    </main>
  );
}
