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
          className="ai-assistant-shell group relative z-10 flex h-[80px] w-[1000px] max-w-full shrink-0 cursor-pointer items-center rounded-[40px] px-[26px] py-[7px] shadow-ai-bar transition hover:shadow-[0px_6px_24px_rgba(171,205,255,0.95)]"
          aria-label="Ask AI Research Assistant"
        >
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[22px]">
            <AiAssistantIcon />

            <span className="font-jakarta text-lg font-medium leading-none text-brand-primary">
              Ask AI Research Assistant
            </span>
          </div>
        </button>
      )}
    </AiAssistantTrigger>
  );
}
