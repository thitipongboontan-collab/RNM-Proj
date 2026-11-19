"use client";

import { useAiAssistant } from "@/components/layout/AiAssistantProvider";

export function AiResearchAssistant() {
  const { openAssistant } = useAiAssistant();

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openAssistant();
      }}
      className="inline-flex h-12 items-center gap-3 rounded-full bg-[linear-gradient(90deg,#7A45E8_0%,#4D5CAD_48%,#1C2454_100%)] px-5 text-white shadow-[0_10px_24px_rgba(74,63,158,0.28)] transition hover:brightness-[1.05] sm:h-14 sm:px-6"
      aria-label="Ask AI Research Assistant"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 16.5L20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="font-sans whitespace-nowrap text-sm font-semibold sm:text-base">
        Ask AI Research Assistant
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12H19M19 12L13 6M19 12L13 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
