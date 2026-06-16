import type { ResearchNewsItem } from "@/data/research-news";

import { ResearchNewsCard } from "@/components/home/ResearchNewsCard";
import { ResearchNewsCarousel } from "@/components/home/ResearchNewsCarousel";

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-5">
      <span className="h-9 w-[5px] shrink-0 bg-brand-primary" />
      <span className="font-sans text-base font-medium leading-none tracking-[0.0208em] text-brand-primary">
        {children}
      </span>
    </div>
  );
}

export function ResearchNewsSection({ items }: { items: ResearchNewsItem[] }) {
  const useCarousel = items.length > 1;

  return (
    <section id="research-news" className="mx-auto w-full max-w-[1316px] px-4 pb-[72px] sm:px-6 lg:px-8">
      <SectionLabel>ข่าวสาร</SectionLabel>

      <div className="mt-8 flex flex-col gap-5 sm:mt-10">
        <h2 className="font-sans text-2xl font-bold leading-tight text-brand-dark sm:text-[36px]">
          ข่าวสารงานวิจัย
        </h2>
        <p className="font-sans max-w-[900px] text-base font-medium leading-relaxed text-brand-muted sm:text-lg sm:leading-normal">
          อัปเดตข้อมูล ข่าวสาร และกิจกรรมด้านการวิจัย เพื่อติดตามความเคลื่อนไหวทางวิชาการล่าสุด
        </p>
      </div>

      <div className="mt-8 sm:mt-10">
        {useCarousel ? (
          <ResearchNewsCarousel items={items} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {items.map((item) => (
              <ResearchNewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
