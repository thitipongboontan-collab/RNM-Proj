"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const AiAssistantModal = dynamic(
  () =>
    import("@/components/home/AiAssistantModal").then((mod) => mod.AiAssistantModal),
  { ssr: false },
);

type AiAssistantContextValue = {
  openAssistant: () => void;
};

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error("useAiAssistant must be used within AiAssistantProvider");
  }
  return context;
}

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openAssistant = useCallback(() => setOpen(true), []);

  return (
    <AiAssistantContext.Provider value={{ openAssistant }}>
      {children}
      {open ? <AiAssistantModal open onClose={() => setOpen(false)} /> : null}
    </AiAssistantContext.Provider>
  );
}
