import Link from "next/link";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      className="flex min-h-[52px] items-center border-b border-[#D9D9D9] bg-[#FAFAFA] px-4 py-2 sm:min-h-[62px] sm:px-8 sm:py-0 md:px-12 lg:px-20"
    >
      <p className="m-0 text-sm text-[#0247AE] sm:text-base">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <span key={`${segment.label}-${index}`}>
              {segment.href && !isLast ? (
                <Link
                  href={segment.href}
                  className="text-brand-primary hover:underline"
                >
                  {segment.label}
                </Link>
              ) : (
                <span className={isLast ? "text-black/40" : undefined}>
                  {segment.label}
                </span>
              )}
              {!isLast && (
                <span className="text-black/40">
                  {" "}
                  /{" "}
                </span>
              )}
            </span>
          );
        })}
      </p>
    </nav>
  );
}
