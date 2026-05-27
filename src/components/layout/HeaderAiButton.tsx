"use client";

import { AiAssistantIcon } from "@/components/home/AiAssistantIcon";
import { AiAssistantTrigger } from "@/components/home/AiAssistantTrigger";

export function HeaderAiButton() {
  return (
    <AiAssistantTrigger>
      {(open) => (
        <button
          type="button"
          onClick={open}
          aria-label="Ask AI Research Assistant"
          className="flex h-[43px] w-[52px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-r from-[#4D5CAD] to-[#00CACC] shadow-[0px_2px_8px_rgba(77,92,173,0.28)] transition hover:opacity-90"
        >
          <AiAssistantIcon
            white
            className="relative h-[24px] w-[28px] shrink-0"
            iconClassName="absolute left-0 top-[4px] h-[20px] w-[28px] object-contain"
            sparkleClassName="absolute left-[14px] top-0 h-[10px] w-[10px] object-cover"
          />
        </button>
      )}
    </AiAssistantTrigger>
  );
}
