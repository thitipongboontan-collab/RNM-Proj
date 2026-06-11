import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { AiAssistantProvider } from "./AiAssistantProvider";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <AiAssistantProvider>
      <div className="min-h-screen w-full bg-white">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </AiAssistantProvider>
  );
}
