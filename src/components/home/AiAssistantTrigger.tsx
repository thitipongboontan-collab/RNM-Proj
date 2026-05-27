"use client";

import { useState, type ReactNode } from "react";
import { AiAssistantModal } from "./AiAssistantModal";

type AiAssistantTriggerProps = {
  children: (open: () => void) => ReactNode;
};

export function AiAssistantTrigger({ children }: AiAssistantTriggerProps) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    setOpen(true);
  }

  return (
    <>
      {children(handleOpen)}
      <AiAssistantModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
