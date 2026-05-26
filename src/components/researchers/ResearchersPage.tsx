"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import type { ResearcherItem } from "@/data/researchers";
import { ResearcherCard } from "./ResearcherCard";

type DepartmentFilter = {
  id: string;
  label: string;
};

type ResearchersPageProps = {
  items: ResearcherItem[];
  filters: DepartmentFilter[];
};

export function ResearchersPage({ items, filters }: ResearchersPageProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.department === activeFilter);
  }, [activeFilter, items]);

  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "นักวิจัย" },
        ]}
      />
      <main className="flex flex-col items-center gap-[50px] px-[60px] pb-20 pt-10">
        <PageTitle>นักวิจัย</PageTitle>
        <div className="flex w-[1320px] max-w-full flex-col gap-10">
          <div className="flex w-full flex-nowrap items-center gap-[10px] overflow-x-auto pb-1">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`shrink-0 whitespace-nowrap rounded-[20px] px-[30px] py-2.5 text-lg font-semibold ${
                    isActive
                      ? "bg-brand-primary text-white"
                      : "bg-[rgba(235,235,235,0.4)] text-brand-primary"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {visibleItems.length === 0 ? (
            <p className="text-center text-lg text-[#778097]">ไม่พบนักวิจัยในหมวดนี้</p>
          ) : (
            <div className="grid w-full grid-cols-3 gap-x-[30px] gap-y-10">
              {visibleItems.map((item) => (
                <ResearcherCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
