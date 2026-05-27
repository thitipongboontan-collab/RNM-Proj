"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";
import type { ResearcherItem } from "@/data/researchers";
import { ResearcherCard } from "./ResearcherCard";
import { ResearchersPagination } from "./ResearchersPagination";

const PAGE_SIZE = 12;

type DepartmentFilter = {
  id: string;
  label: string;
};

type ResearchersPageProps = {
  items: ResearcherItem[];
  filters: DepartmentFilter[];
  activeDepartment?: string;
};

function sortByScholarlyOutput(items: ResearcherItem[]) {
  return [...items].sort((a, b) => {
    if (b.scholarlyOutput !== a.scholarlyOutput) {
      return b.scholarlyOutput - a.scholarlyOutput;
    }
    return a.name.localeCompare(b.name, "th");
  });
}

export function ResearchersPage({
  items,
  filters,
  activeDepartment = "all",
}: ResearchersPageProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const visibleItems = useMemo(() => {
    const filtered =
      activeDepartment === "all"
        ? items
        : items.filter((item) => item.department === activeDepartment);

    return sortByScholarlyOutput(filtered);
  }, [activeDepartment, items]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [activeDepartment]);

  function handleDepartmentFilter(filterId: string) {
    if (filterId === activeDepartment) return;

    const nextUrl =
      filterId === "all"
        ? "/researchers"
        : `/researchers?department=${encodeURIComponent(filterId)}`;

    router.push(nextUrl, { scroll: false });
  }

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = visibleItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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
          <div className="scrollbar-hide flex w-full flex-nowrap items-center gap-[10px] overflow-x-auto">
            {filters.map((filter) => {
              const isActive = activeDepartment === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleDepartmentFilter(filter.id)}
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
            <>
              <div className="grid w-full grid-cols-3 gap-x-[30px] gap-y-10">
                {paginatedItems.map((item) => (
                  <ResearcherCard key={item.id} item={item} />
                ))}
              </div>

              <ResearchersPagination
                page={page}
                totalPages={totalPages}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              />
            </>
          )}
        </div>
      </main>
    </PageShell>
  );
}
