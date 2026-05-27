import Image from "next/image";
import Link from "next/link";
import type { ResearcherItem } from "@/data/researchers";

export function ResearcherCard({ item }: { item: ResearcherItem }) {
  return (
    <Link
      href={`/researchers/${item.id}`}
      className="flex min-h-[296px] w-full flex-col gap-[27px] rounded-[16px] bg-white px-[30px] py-[35px] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.2)] transition hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-start gap-5">
          <div className="relative h-[147px] w-[130px] shrink-0 overflow-hidden rounded-[10px] bg-gradient-to-br from-[#D2D8EC] to-[#C1DFED]">
            {item.imageSrc && (
              <Image
                src={item.imageSrc}
                alt={item.name}
                fill
                sizes="130px"
                className="object-cover object-top"
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
            <div className="flex flex-col gap-1">
              <h2
                className="line-clamp-2 font-bold leading-tight text-brand-dark"
                style={{ fontSize: item.name.length > 30 ? 14 : 18 }}
                title={item.name}
              >
                {item.name}
              </h2>
              <p className="line-clamp-2 text-base leading-[1.45] text-[rgba(37,50,75,0.8)]">
                {item.department}
              </p>
            </div>
            <div className="flex flex-col gap-[10px]">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="w-fit max-w-full truncate rounded-[20px] border border-[#12B2C5] px-2.5 py-[3px] text-[10px] font-medium leading-[14px] text-[#12B2C5]"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      <div className="mt-auto flex shrink-0 items-center justify-center gap-8 border-t border-[#D9D9D9] pt-[18px]">
        <Stat label="Scholarly Output" value={item.scholarlyOutput} />
        <div className="h-9 w-px bg-[#D9D9D9]" />
        <Stat label="Citations" value={item.citations} />
        <div className="h-9 w-px bg-[#D9D9D9]" />
        <Stat label="h-index" value={item.hIndex} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[20px] font-bold leading-[27px] text-brand-dark">{value}</span>
      <span className="whitespace-nowrap text-[13px] leading-[18px] text-[#9F9F9F]">
        {label}
      </span>
    </div>
  );
}
