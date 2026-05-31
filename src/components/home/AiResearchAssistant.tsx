"use client";

import { AiAssistantIcon } from "./AiAssistantIcon";
import { AiAssistantTrigger } from "./AiAssistantTrigger";

export function AiResearchAssistant() {
  return (
    <AiAssistantTrigger>
      {(open) => (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            open();
          }}
          className="ai-assistant-shell group relative z-10 flex min-h-[64px] w-full max-w-[620px] shrink-0 cursor-pointer items-center rounded-[40px] px-5 py-[7px] shadow-ai-bar transition hover:shadow-[0px_6px_24px_rgba(171,205,255,0.95)] sm:h-[68px] sm:px-[24px]"
          aria-label="Ask AI Research Assistant"
        >
          <div className="absolute left-1/2 top-1/2 flex w-full max-w-[280px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-3 px-4 sm:max-w-none sm:gap-[22px] sm:px-0">
            <AiAssistantIcon white />

            <span className="font-jakarta text-center text-base font-medium leading-tight text-white sm:text-lg sm:leading-none">
              Ask AI Research Assistant
            </span>
          </div>
        </button>
      )}
    </AiAssistantTrigger>
  );
}
