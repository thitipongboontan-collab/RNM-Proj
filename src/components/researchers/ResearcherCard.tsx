import Link from "next/link";
import type { ResearcherItem } from "@/data/researchers";

export function ResearcherCard({ item }: { item: ResearcherItem }) {
  return (
    <Link
      href={`/researchers/${item.id}`}
      className="flex w-[420px] flex-col gap-[27px] rounded-2xl bg-white px-[30px] py-[35px] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.2)] transition hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.15)]"
    >
      <div className="flex flex-col gap-[27px]">
        <div className="flex items-center gap-5">
          <div className="h-[120px] w-[120px] shrink-0 rounded-[10px] bg-gradient-to-br from-[#D2D8EC] to-[#C1DFED]" />
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-brand-dark">{item.name}</h2>
            <p className="text-base text-[#778097]">{item.department}</p>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[20px] border border-brand-primary px-3 py-1 text-xs text-brand-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 border-t border-[#D9D9D9] pt-6">
          <Stat label="Scholarly Output" value={item.scholarlyOutput} />
          <div className="h-10 w-px bg-[#D9D9D9]" />
          <Stat label="Citations" value={item.citations} />
          <div className="h-10 w-px bg-[#D9D9D9]" />
          <Stat label="h-index" value={item.hIndex} />
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xl font-bold text-brand-dark">{value}</span>
      <span className="text-xs text-[#778097]">{label}</span>
    </div>
  );
}
