import type { ReactNode } from "react";

export function PageTitle({ children }: { children: string }) {
  return (
    <h1 className="text-gradient-page-title inline-block py-[0.22em] text-2xl font-bold leading-[1.45] tracking-[0.0156em] sm:text-[32px]">
      {children}
    </h1>
  );
}

export function PageLead({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-4xl text-center text-sm leading-relaxed text-brand-muted sm:text-base">
      {children}
    </p>
  );
}
