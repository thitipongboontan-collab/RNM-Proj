"use client";

import Link from "next/link";
import { ChevronIcon } from "@/components/ui/CircularPageNav";

function PageNavLink({
  direction,
  href,
  disabled,
}: {
  direction: "left" | "right";
  href?: string;
  disabled: boolean;
}) {
  const className = `flex h-[37px] w-[37px] items-center justify-center rounded-full border bg-white transition ${
    disabled
      ? "cursor-not-allowed border-[#E5E5E5] text-[#E5E5E5] pointer-events-none"
      : "border-brand-primary text-brand-primary hover:bg-[#F4F6FC]"
  }`;

  if (disabled || !href) {
    return (
      <span
        aria-disabled
        aria-label={direction === "left" ? "หน้าก่อนหน้า" : "หน้าถัดไป"}
        className={className}
      >
        <ChevronIcon direction={direction} />
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={direction === "left" ? "หน้าก่อนหน้า" : "หน้าถัดไป"}
      className={className}
    >
      <ChevronIcon direction={direction} />
    </Link>
  );
}

export function DetailPagination({
  page,
  totalPages,
  prevId,
  nextId,
}: {
  page: number;
  totalPages: number;
  prevId?: string;
  nextId?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex w-full items-center justify-end gap-5 py-5 pl-[90px] pr-[65px]">
      <span className="text-base leading-[30px] text-black">หน้า {page}</span>
      <PageNavLink
        direction="left"
        href={prevId ? `/funding/${prevId}` : undefined}
        disabled={!prevId}
      />
      <PageNavLink
        direction="right"
        href={nextId ? `/funding/${nextId}` : undefined}
        disabled={!nextId}
      />
    </div>
  );
}
