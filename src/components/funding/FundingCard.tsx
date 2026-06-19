import Image from "next/image";
import Link from "next/link";
import { FundingStarButton } from "@/components/funding/FundingStarButton";
import { HERO_GRADIENT, type FundingListItem } from "@/data/funding";
import { resolveImagePositionCss } from "@/lib/image-position";

type FundingCardProps = {
  item: FundingListItem;
  starred?: boolean;
  onToggleStar?: (id: string) => void;
};

export function FundingCard({ item, starred = false, onToggleStar }: FundingCardProps) {
  return (
    <article className="relative flex w-full flex-col">
      {onToggleStar ? (
        <div className="absolute right-3 top-3 z-10">
          <FundingStarButton
            active={starred}
            title={item.title}
            onToggle={() => onToggleStar(item.id)}
          />
        </div>
      ) : null}
      <Link
        href={`/funding/${item.id}`}
        prefetch={false}
        className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_0px_5px_0px_rgba(0,0,0,0.2)] transition hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.15)]"
      >
        <div
          className="relative h-[265px] w-full overflow-hidden rounded-t-2xl"
          style={{
            background: item.imageSrc ? undefined : HERO_GRADIENT[item.imageVariant],
          }}
        >
          {item.imageSrc && (
            <Image
              src={item.imageSrc}
              alt={item.title}
              fill
              sizes="420px"
              className="object-cover"
              style={{ objectPosition: resolveImagePositionCss(item.imagePosition) }}
              unoptimized={item.imageSrc.startsWith("http")}
            />
          )}
        </div>
        <div className="flex flex-col gap-[25px] px-[30px] pb-[35px] pt-[27px]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-[13px]">
              <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-[0.0278em] text-brand-dark">
                {item.title}
              </h2>
              <p className="text-base tracking-[0.0313em] text-brand-dark/80">
                {item.organization}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="whitespace-nowrap rounded-[20px] border border-[#12B2C5] px-3 py-[3px] text-xs font-medium text-[#12B2C5] sm:px-5">
                {item.openDate}
              </span>
              <span className="whitespace-nowrap rounded-[20px] border border-[#C5126C] px-3 py-[3px] text-xs font-medium text-[#C5126C] sm:px-5">
                {item.closeDate}
              </span>
            </div>
          </div>
          <div className="h-px w-full bg-[#D9D9D9]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#778097]">
              <span aria-hidden>📅</span>
              <span>{item.publishedDate}</span>
            </div>
            <span className="flex items-center gap-2 text-base font-medium text-brand-primary">
              อ่านต่อ
              <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
