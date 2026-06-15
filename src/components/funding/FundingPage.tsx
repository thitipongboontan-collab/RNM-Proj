"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ResearchersPagination } from "@/components/ui/CircularPageNav";
import { PageTitle } from "@/components/ui/PageTitle";
import type { FundingListItem } from "@/data/funding";
import { useFundingFavorites } from "@/lib/funding-favorites";
import { FundingCard } from "./FundingCard";

const PAGE_SIZE = 9;

function matchesSearch(item: FundingListItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    item.title,
    item.organization,
    item.statusLabel,
    item.openDate,
    item.closeDate,
    item.publishedDate,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function FundingPage({ items }: { items: FundingListItem[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { favoriteIds, isFavorite, toggleFavorite } = useFundingFavorites();

  const filteredItems = useMemo(() => {
    const matched = items.filter((item) => matchesSearch(item, query));

    return [...matched].sort((a, b) => {
      const aIndex = favoriteIds.indexOf(a.id);
      const bIndex = favoriteIds.indexOf(b.id);
      const aFavorite = aIndex >= 0;
      const bFavorite = bIndex >= 0;

      if (aFavorite && !bFavorite) return -1;
      if (!aFavorite && bFavorite) return 1;
      if (aFavorite && bFavorite) return aIndex - bIndex;
      return 0;
    });
  }, [items, query, favoriteIds]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, favoriteIds]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แหล่งทุน" },
        ]}
      />
      <main className="flex flex-col items-center gap-8 px-4 pb-12 pt-6 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-8 md:px-10 lg:gap-[50px] lg:px-[60px] lg:pb-20 lg:pt-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <PageTitle>แหล่งทุน</PageTitle>
          <p className="max-w-[760px] text-sm leading-relaxed text-brand-muted sm:text-base">
            รวมประกาศทุนวิจัยจากทุกแหล่งทุน ทั้งในประเทศและต่างประเทศ
          </p>
        </div>

        <div className="flex w-full max-w-[1320px] flex-col gap-8 sm:gap-10">
          <div className="relative w-full">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อทุน, หน่วยงาน, Keyword..."
              className="w-full rounded-full border border-[#D9DEE8] bg-white px-5 py-3.5 pr-12 text-sm text-brand-dark outline-none transition placeholder:text-[#A0A8BC] focus:border-brand-primary sm:px-6 sm:py-4 sm:text-base"
            />
            {query ? (
              <button
                type="button"
                aria-label="ล้างการค้นหา"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-[#778097] transition hover:bg-[#F3F5FA] hover:text-brand-dark"
              >
                ×
              </button>
            ) : null}
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-center text-lg text-[#778097]">ไม่พบแหล่งทุนที่ตรงกับคำค้นหา</p>
          ) : (
            <>
              <div className="grid w-full grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-[30px]">
                {paginatedItems.map((item) => (
                  <FundingCard
                    key={item.id}
                    item={item}
                    starred={isFavorite(item.id)}
                    onToggleStar={toggleFavorite}
                  />
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
