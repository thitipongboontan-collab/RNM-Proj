import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AttachmentCard, DownloadIcon } from "@/components/funding/FundingDetailParts";
import { AdaptiveDetailLayout } from "@/components/detail/AdaptiveDetailLayout";
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

function getAttachmentType(fileName?: string): "doc" | "pdf" {
  return fileName?.toLowerCase().endsWith(".doc") ||
    fileName?.toLowerCase().endsWith(".docx")
    ? "doc"
    : "pdf";
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

      <section className="flex flex-col items-center gap-[30px] px-4 pb-0 pt-[50px] sm:px-8 lg:px-20">
        <h1 className="max-w-[1280px] text-center text-[32px] font-bold leading-snug text-brand-primary">
          {item.title}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <span className="rounded-[20px] bg-brand-primary/10 px-5 py-[3px] text-base font-medium text-brand-primary">
            {item.category}
          </span>
          <span className="text-lg text-[#5F5F60]">{item.publishedDate}</span>
          <span className="flex items-center gap-1 text-lg text-[#5F5F60]">
            <EyeIcon />
            {item.views} views
          </span>
        </div>
      </section>

      <section className="px-4 py-[50px] sm:px-8 lg:px-20">
        <div className="mx-auto w-full max-w-[1280px]">
          <AdaptiveDetailLayout
            imageSrc={item.imageSrc}
            imageAlt={item.title}
            fallbackBackground={item.imageGradient}
            details={
              <div className="flex flex-col gap-5">
                <h2 className="text-[25px] font-semibold text-brand-dark">รายละเอียด</h2>

                <div className="whitespace-pre-line text-lg leading-relaxed text-brand-dark">
                  {item.details}
                </div>

                {item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    เปิดลิงก์เพิ่มเติม
                  </a>
                ) : null}
              </div>
            }
            downloads={
              item.attachmentUrl ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-[3px]">
                    <DownloadIcon />
                    <span className="text-[25px] font-semibold text-brand-dark">
                      ดาวน์โหลดไฟล์ที่เกี่ยวข้อง
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-5">
                    <AttachmentCard
                      file={{
                        id: "news-attachment",
                        fileName: item.attachmentFileName ?? "ไฟล์แนบ",
                        type: getAttachmentType(item.attachmentFileName),
                        downloadUrl: item.attachmentUrl,
                      }}
                    />
                  </div>
                </div>
              ) : undefined
            }
            footer={
              <Link
                href="/"
                className="inline-flex rounded-xl border border-[#D9DEE8] px-5 py-3 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
              >
                กลับหน้าหลัก
              </Link>
            }
          />
        </div>
      </section>
    </>
  );
}
