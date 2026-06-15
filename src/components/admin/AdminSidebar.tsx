"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";

export function AdminSidebar() {
  const pathname = usePathname() ?? "/admin";

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#E5E7EF] bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="border-b border-[#E5E7EF] px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
          Admin
        </p>
        <h1 className="mt-1 text-lg font-bold text-brand-dark">Research Nexus</h1>
      </div>

      <nav className="flex flex-row gap-2 overflow-x-auto px-4 py-4 lg:flex-col lg:gap-1 lg:px-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const isDisabled = "disabled" in item && item.disabled;

          if (isDisabled) {
            return (
              <span
                key={item.href}
                className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-[#A0A8BC] lg:w-full"
                title="จะเปิดใช้งานใน Phase ถัดไป"
              >
                {item.label}
                <span className="ml-2 text-xs">(เร็ว ๆ นี้)</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition lg:w-full ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "text-brand-dark hover:bg-[#F3F5FA]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
