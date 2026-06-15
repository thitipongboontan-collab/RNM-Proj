import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { ResearchNewsDetail } from "@/data/research-news";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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

export function ResearchNewsDetailPage({ item }: { item: ResearchNewsDetail }) {
  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "ข่าวสารงานวิจัย", href: "/#research-news" },
          { label: "รายละเอียดข่าว" },
        ]}
      />

      <article className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-brand-primary/10 px-4 py-1 text-sm font-medium text-brand-primary">
            {item.category}
          </span>
          <span className="text-sm text-brand-muted">{item.publishedDate}</span>
          <span className="flex items-center gap-1 text-sm text-brand-muted">
            <EyeIcon />
            {item.views} views
          </span>
        </div>

        <h1 className="mt-5 font-sans text-2xl font-bold leading-snug text-brand-dark sm:text-3xl">
          {item.title}
        </h1>

        {item.imageSrc ? (
          <div className="mt-8 overflow-hidden rounded-2xl bg-[#EEF1F6]">
            <Image
              src={item.imageSrc}
              alt={item.title}
              width={900}
              height={600}
              className="h-auto w-full"
              priority
              unoptimized={item.imageSrc.startsWith("http")}
            />
          </div>
        ) : (
          <div
            className="mt-8 aspect-[16/9] w-full rounded-2xl"
            style={{ background: item.imageGradient }}
            aria-hidden
          />
        )}

        <div className="mt-8 whitespace-pre-line font-sans text-base leading-relaxed text-brand-dark sm:text-lg">
          {item.details}
        </div>

        {(item.externalUrl || item.attachmentUrl) && (
          <div className="mt-8 flex flex-wrap gap-3 border-t border-[#EEF1F6] pt-6">
            {item.externalUrl ? (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                เปิดลิงก์เพิ่มเติม
              </a>
            ) : null}
            {item.attachmentUrl ? (
              <a
                href={item.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#D9DEE8] px-5 py-3 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
              >
                {item.attachmentFileName ? `ดาวน์โหลด ${item.attachmentFileName}` : "ดาวน์โหลดไฟล์แนบ"}
              </a>
            ) : null}
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex rounded-xl border border-[#D9DEE8] px-5 py-3 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </article>
    </>
  );
}
