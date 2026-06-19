import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CopyLinkButton } from "@/components/funding/CopyLinkButton";
import {
  AttachmentCard,
  DownloadIcon,
  MetaItem,
} from "@/components/funding/FundingDetailParts";
import { DetailPagination } from "@/components/funding/FundingDetailPagination";
import { AdaptiveDetailLayout } from "@/components/detail/AdaptiveDetailLayout";
import { HERO_GRADIENT, type FundingItem } from "@/data/funding";

export function FundingDetailPage({
  item,
  page,
  totalPages,
  prevId,
  nextId,
}: {
  item: FundingItem;
  page: number;
  totalPages: number;
  prevId?: string;
  nextId?: string;
}) {
  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แหล่งทุน", href: "/funding" },
          { label: "รายละเอียดแหล่งทุน" },
        ]}
      />

      <section className="flex flex-col items-center gap-[30px] px-4 pb-0 pt-[50px] sm:px-8 lg:px-20">
        <h1 className="max-w-[1280px] text-center text-[32px] font-bold leading-snug text-brand-primary">
          {item.detail.fullTitle}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <span className="rounded-[20px] bg-[#12B2C5] px-5 py-[3px] text-base font-medium text-white">
            {item.statusLabel}
          </span>
          <MetaItem icon="org" text={item.detail.organization} />
          <MetaItem icon="date" text={item.detail.publishedDate} />
          <CopyLinkButton />
        </div>
      </section>

      <section className="px-4 py-[50px] sm:px-8 lg:px-20">
        <div className="mx-auto w-full max-w-[1280px]">
          <AdaptiveDetailLayout
            imageSrc={item.imageSrc}
            imageAlt={item.detail.fullTitle}
            fallbackBackground={HERO_GRADIENT[item.imageVariant]}
            extraImages={item.detail.detailImages}
            details={
              <div className="flex flex-col gap-5">
                <h2 className="text-[25px] font-semibold text-brand-dark">รายละเอียด</h2>

                <div className="space-y-5 text-lg leading-relaxed text-brand-dark">
                  {item.detail.bodySections.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="m-0 whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}

                  {item.detail.bulletGroups?.map((group) => (
                    <ul key={group.items[0]} className="list-disc space-y-2 pl-6">
                      {group.items.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ))}

                  {item.detail.numberedList && (
                    <div className="space-y-3">
                      <p className="font-medium">{item.detail.numberedList.title}</p>
                      <ol className="list-decimal space-y-2 pl-6">
                        {item.detail.numberedList.items.map((entry) => (
                          <li key={entry.slice(0, 30)}>{entry}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {item.detail.closingNote && (
                    <p className="whitespace-pre-line">
                      การประกาศผลการพิจารณา — {item.detail.closingNote}{" "}
                      <a
                        href={item.detail.nrctUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-dark underline"
                      >
                        www.nrct.go.th
                      </a>{" "}
                      และ{" "}
                      <a
                        href={item.detail.nriisUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-dark underline"
                      >
                        {item.detail.nriisUrl}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            }
            downloads={
              item.detail.attachments.length > 0 ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-[3px]">
                    <DownloadIcon />
                    <span className="text-[25px] font-semibold text-brand-dark">
                      {item.detail.downloadLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-5">
                    {item.detail.attachments.map((file) => (
                      <AttachmentCard key={file.id} file={file} />
                    ))}
                  </div>
                </div>
              ) : undefined
            }
            footer={
              <DetailPagination
                page={page}
                totalPages={totalPages}
                prevId={prevId}
                nextId={nextId}
              />
            }
          />
        </div>
      </section>
    </>
  );
}
