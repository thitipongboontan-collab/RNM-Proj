"use client";

import { useState } from "react";
import type { ResearchNewsItem } from "@/data/research-news";
import { ResearchNewsCard } from "@/components/home/ResearchNewsCard";
import { PageNavButton } from "@/components/ui/CircularPageNav";

const CARDS_PER_PAGE = 4;

export function ResearchNewsCarousel({ items }: { items: ResearchNewsItem[] }) {
  const totalPages = Math.ceil(items.length / CARDS_PER_PAGE);
  const [page, setPage] = useState(0);
  const visible = items.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
      <PageNavButton
        direction="left"
        disabled={page === 0}
        onClick={() => setPage((current) => Math.max(0, current - 1))}
      />

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {visible.map((item) => (
          <ResearchNewsCard key={item.id} item={item} />
        ))}
      </div>

      <PageNavButton
        direction="right"
        disabled={page >= totalPages - 1}
        onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
      />
    </div>
  );
}
