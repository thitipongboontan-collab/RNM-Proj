"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import { RESEARCHER_FILTERS, RESEARCHER_ITEMS } from "@/data/researchers";
import { ResearcherCard } from "./ResearcherCard";

export function ResearchersPage() {
  const [activeFilter, setActiveFilter] = useState("all");

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
        <div className="flex w-[1320px] flex-col gap-10">
          <div className="flex flex-wrap gap-2.5">
            {RESEARCHER_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-[20px] px-[30px] py-2.5 text-lg font-semibold ${
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
          <div className="flex flex-col gap-10">
            <div className="flex justify-center gap-10">
              {RESEARCHER_ITEMS.slice(0, 3).map((item) => (
                <ResearcherCard key={item.id} item={item} />
              ))}
            </div>
            <div className="flex justify-center gap-10">
              {RESEARCHER_ITEMS.slice(3, 6).map((item) => (
                <ResearcherCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
