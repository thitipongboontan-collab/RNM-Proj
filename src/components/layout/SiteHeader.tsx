"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAiButton } from "@/components/layout/HeaderAiButton";
import { NAV_ITEMS } from "@/lib/navigation";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header
      className="relative z-20 h-[101px] w-full bg-white/80 px-[62px] pr-[60px] backdrop-blur-[10px]"
      style={{
        height: 101,
        backgroundColor: "rgba(255,255,255,0.8)",
        paddingLeft: 62,
        paddingRight: 60,
      }}
    >
      <div
        className="flex h-full items-center justify-between"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}
      >
        <Link
          href="/"
          className="flex w-[372px] shrink-0 items-center gap-[10px]"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Research Nexus Matching"
            width={50}
            height={50}
            style={{ width: 50, height: 50, objectFit: "cover", flexShrink: 0 }}
          />
          <div style={{ width: 319 }}>
            <p
              className="font-sans text-base font-bold leading-tight tracking-[0.0313em] text-brand-primary"
              style={{ fontSize: 16, fontWeight: 700, color: "#4D5CAD", margin: 0 }}
            >
              Research Nexus Matching
            </p>
            <p
              className="font-sans mt-0.5 text-xs font-semibold leading-snug tracking-[0.0417em] text-brand-primary"
              style={{ fontSize: 12, fontWeight: 600, color: "#4D5CAD", margin: "2px 0 0" }}
            >
              ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
            </p>
          </div>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-[30px]"
          style={{ display: "flex", alignItems: "center", gap: 30 }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-sans whitespace-nowrap text-xl font-semibold leading-none tracking-[0.025em] ${
                  isActive ? "text-brand-primary" : "text-brand-dark"
                }`}
                style={{
                  whiteSpace: "nowrap",
                  fontSize: 20,
                  fontWeight: 600,
                  color: isActive ? "#4D5CAD" : "#25324B",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <HeaderAiButton />
        </nav>
      </div>
    </header>
  );
}
