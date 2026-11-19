"use client";

import { useAiAssistant } from "@/components/layout/AiAssistantProvider";

export function HeaderAiButton() {
  const { openAssistant } = useAiAssistant();

  return (
    <button
      type="button"
      onClick={openAssistant}
      aria-label="Ask AI Research Assistant"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(90deg,#7A45E8_0%,#4D5CAD_48%,#1C2454_100%)] text-white shadow-[0_6px_16px_rgba(74,63,158,0.28)] transition hover:brightness-[1.05]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 16.5L20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
