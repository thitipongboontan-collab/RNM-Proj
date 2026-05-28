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
    <header className="relative z-20 w-full border-b border-[#E8E8E8] bg-white/80 backdrop-blur-[10px]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-[88px] sm:gap-4 sm:px-6 md:px-10 lg:h-[101px] lg:px-[62px] lg:pr-[60px]">
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
            <p className="truncate font-sans text-sm font-bold leading-tight tracking-[0.0313em] text-brand-primary sm:text-base">
              Research Nexus Matching
            </p>
            <p className="mt-0.5 hidden font-sans text-xs font-semibold leading-snug tracking-[0.0417em] text-brand-primary sm:line-clamp-2 md:block">
              ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex lg:gap-[30px]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap font-sans text-lg font-semibold leading-none tracking-[0.025em] xl:text-xl ${
                isActive(item.href) ? "text-brand-primary" : "text-brand-dark"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <HeaderAiButton />
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <HeaderAiButton />
          <button
            type="button"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-dark transition hover:bg-[#F4F6FC]"
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
          <nav className="absolute left-0 right-0 top-full z-40 border-b border-[#E8E8E8] bg-white px-4 py-4 shadow-lg sm:px-6 lg:hidden">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-xl px-4 py-3 font-sans text-lg font-semibold ${
                      isActive(item.href)
                        ? "bg-[#F4F6FC] text-brand-primary"
                        : "text-brand-dark hover:bg-[#FAFBFD]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
