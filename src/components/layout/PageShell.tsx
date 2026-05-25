import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full overflow-x-auto bg-white"
      style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}
    >
      <div
        className="relative mx-auto w-[1440px]"
        style={{ width: 1440, maxWidth: "100%", margin: "0 auto" }}
      >
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
