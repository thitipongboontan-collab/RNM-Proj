import Image from "next/image";
import Link from "next/link";
import type { ResearchNewsItem } from "@/data/research-news";

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ReadMoreButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
    >
      อ่านต่อ
    </Link>
  );
}

export function ResearchNewsCard({ item }: { item: ResearchNewsItem }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_0px_5px_0px_rgba(0,0,0,0.12)] transition hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)]">
      <div className="relative h-[140px] w-full shrink-0 sm:h-[155px]">
        <div
          className="absolute inset-0"
          style={{ background: item.imageSrc ? undefined : item.imageGradient }}
          aria-hidden={Boolean(item.imageSrc)}
        />
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={item.title}
            fill
            className="object-cover"
            unoptimized={item.imageSrc.startsWith("http")}
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-brand-dark backdrop-blur-sm">
          {item.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
        <h3 className="line-clamp-2 min-h-[3rem] font-sans text-sm font-bold leading-snug text-brand-dark sm:min-h-[3.25rem] sm:text-base">
          {item.title}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EEF1F6] pt-3">
          <span className="shrink-0 text-xs text-[#778097] sm:text-sm">{item.publishedDate}</span>
          <span className="flex items-center gap-1 text-xs text-[#778097] sm:text-sm">
            <EyeIcon />
            {item.views} views
          </span>
          <ReadMoreButton href={`/news/${item.id}`} />
        </div>
      </div>
    </article>
  );
}
