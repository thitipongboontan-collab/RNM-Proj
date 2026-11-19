"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderAiButton } from "@/components/layout/HeaderAiButton";
import { NAV_ITEMS } from "@/lib/navigation";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M6 6L18 18M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header
      className={
        isHome
          ? "fixed inset-x-0 top-0 z-20 w-full border-b border-[rgba(28,36,84,0.08)] bg-white/90 shadow-[0_8px_28px_rgba(28,36,84,0.06)] backdrop-blur-[16px]"
          : "sticky top-0 z-20 w-full border-b border-[rgba(28,36,84,0.08)] bg-white/[0.94] shadow-[0_4px_16px_rgba(28,36,84,0.04)] backdrop-blur-[16px]"
      }
    >
      <div className="relative mx-auto flex h-[72px] w-full max-w-[1316px] items-center justify-between gap-3 px-4 sm:h-[88px] sm:px-6 lg:h-[92px] lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 sm:gap-[10px] lg:max-w-[372px] lg:flex-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="Research Nexus Matching"
            width={50}
            height={50}
            className="h-10 w-10 shrink-0 object-cover sm:h-[50px] sm:w-[50px]"
          />
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-bold leading-tight tracking-[0.02em] text-[#1C2454] sm:text-base">
              Research Nexus Matching
            </p>
            <p className="mt-0.5 hidden font-sans text-[11px] font-medium leading-snug text-[#8A94A8] sm:line-clamp-2 md:block">
              ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
            </p>
          </div>
        </Link>

        <nav className="hidden items-center lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2 lg:gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 font-sans text-sm font-medium leading-none transition xl:px-4 xl:text-[15px] ${
                  active
                    ? "bg-[#EEE9F8] text-[#5B4DB8]"
                    : "text-[#5C6780] hover:bg-[#F3F4F8] hover:text-[#31405C]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderAiButton />
          <button
            type="button"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#31405C] transition hover:bg-[#F3F4F8] lg:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="fixed inset-0 z-30 bg-[rgba(37,50,75,0.35)] lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-full z-40 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-md sm:px-6 lg:hidden">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-full px-4 py-3 font-sans text-base font-medium ${
                        active
                          ? "bg-[#EEE9F8] text-[#5B4DB8]"
                          : "text-[#5C6780] hover:bg-[#FAFBFD]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
