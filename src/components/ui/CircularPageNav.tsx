"use client";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
      {direction === "left" ? (
        <path
          d="M8 2L2 8L8 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2 2L8 8L2 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function PageNavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "หน้าก่อนหน้า" : "หน้าถัดไป"}
      className={`flex h-[37px] w-[37px] items-center justify-center rounded-full border bg-white transition ${
        disabled
          ? "cursor-not-allowed border-[#E5E5E5] text-[#E5E5E5]"
          : "border-brand-primary text-brand-primary hover:bg-[#F4F6FC]"
      }`}
    >
      <ChevronIcon direction={direction} />
    </button>
  );
}

export function ResearchersPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex w-full items-center justify-end gap-5 py-5 pl-[90px] pr-[65px]">
      <span className="text-base leading-[30px] text-black">หน้า {page}</span>
      <PageNavButton
        direction="left"
        disabled={page === 1}
        onClick={onPrevious}
      />
      <PageNavButton
        direction="right"
        disabled={page === totalPages}
        onClick={onNext}
      />
    </div>
  );
}

export { ChevronIcon, PageNavButton };
