import Link from "next/link";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      className="flex h-[62px] items-center border-b border-[#D9D9D9] bg-[#FAFAFA] px-20"
      style={{
        display: "flex",
        height: 62,
        alignItems: "center",
        borderBottom: "1px solid #D9D9D9",
        backgroundColor: "#FAFAFA",
        paddingLeft: 80,
        paddingRight: 80,
      }}
    >
      <p className="text-base text-[#0247AE]" style={{ fontSize: 16, margin: 0 }}>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <span key={`${segment.label}-${index}`}>
              {segment.href && !isLast ? (
                <Link
                  href={segment.href}
                  className="text-brand-primary hover:underline"
                  style={{ color: "#4D5CAD", textDecoration: "none" }}
                >
                  {segment.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "text-black/40" : undefined}
                  style={isLast ? { color: "rgba(0,0,0,0.4)" } : undefined}
                >
                  {segment.label}
                </span>
              )}
              {!isLast && (
                <span className="text-black/40" style={{ color: "rgba(0,0,0,0.4)" }}>
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
