"use client";

type FundingStarButtonProps = {
  active: boolean;
  onToggle: () => void;
  title: string;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5L14.9 9.1L22 10.2L16.8 15.1L18.1 22.2L12 18.8L5.9 22.2L7.2 15.1L2 10.2L9.1 9.1L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function FundingStarButton({ active, onToggle, title }: FundingStarButtonProps) {
  return (
    <button
      type="button"
      aria-label={active ? `เลิกติดดาว ${title}` : `ติดดาว ${title}`}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:scale-105 ${
        active
          ? "border-[#F59E0B] text-[#F59E0B]"
          : "border-white/80 text-[#778097] hover:text-[#F59E0B]"
      }`}
    >
      <StarIcon filled={active} />
    </button>
  );
}
