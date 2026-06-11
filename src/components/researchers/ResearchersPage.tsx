"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
};

function resolveDepartmentFromQuery(
  department: string | null,
  filters: DepartmentFilter[],
): string {
  if (department && filters.some((filter) => filter.id === department)) {
    return department;
  }
  return "all";
}

function sortByScholarlyOutput(items: ResearcherItem[]) {
  return [...items].sort((a, b) => {
    if (b.scholarlyOutput !== a.scholarlyOutput) {
      return b.scholarlyOutput - a.scholarlyOutput;
    }
    return a.id.localeCompare(b.id);
  });
}

export function ResearchersPage({
  items,
  filters,
}: ResearchersPageProps) {
  const searchParams = useSearchParams();
  const [activeDepartment, setActiveDepartment] = useState(() =>
    resolveDepartmentFromQuery(searchParams.get("department"), filters),
  );
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

    setActiveDepartment(filterId);
    const nextUrl =
      filterId === "all"
        ? "/researchers"
        : `/researchers?department=${encodeURIComponent(filterId)}`;
    window.history.replaceState(null, "", nextUrl);
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
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "นักวิจัย" },
        ]}
      />
      <main className="flex flex-col items-center gap-8 px-4 pb-12 pt-6 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-8 md:px-10 lg:gap-[50px] lg:px-[60px] lg:pb-20 lg:pt-10">
        <PageTitle>นักวิจัย</PageTitle>
        <div className="flex w-full max-w-[1320px] flex-col gap-8 sm:gap-10">
          <div className="scrollbar-hide -mx-1 flex w-full flex-nowrap items-center gap-2 overflow-x-auto px-1 sm:gap-[10px]">
            {filters.map((filter) => {
              const isActive = activeDepartment === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleDepartmentFilter(filter.id)}
                  className={`shrink-0 whitespace-nowrap rounded-[20px] px-4 py-2 text-base font-semibold sm:px-[30px] sm:py-2.5 sm:text-lg ${
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
              <div className="grid w-full grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-[30px]">
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
    </>
  );
}
