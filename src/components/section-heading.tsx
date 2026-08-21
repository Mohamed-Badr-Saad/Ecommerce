import Link from "next/link";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-4xl tracking-[-0.035em] sm:text-5xl">{title}</h2>
        {description ? (
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link href={action.href} className="w-fit border-b border-foreground pb-1 text-sm font-medium">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
