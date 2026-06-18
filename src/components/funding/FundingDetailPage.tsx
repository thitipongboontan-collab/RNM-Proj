import Image from "next/image";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CopyLinkButton } from "@/components/funding/CopyLinkButton";
import {
  AttachmentCard,
  DownloadIcon,
  MetaItem,
} from "@/components/funding/FundingDetailParts";
import { DetailPagination } from "@/components/funding/FundingDetailPagination";
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

      <section
        className="flex flex-col items-center gap-[30px] px-20 pb-0 pt-[50px]"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
          padding: "50px 80px 0",
        }}
      >
        <h1
          className="max-w-[1280px] text-center text-[32px] font-bold leading-snug text-brand-primary"
          style={{
            maxWidth: 1280,
            textAlign: "center",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.375,
            color: "#4D5CAD",
            margin: 0,
          }}
        >
          {item.detail.fullTitle}
        </h1>

        <div
          className="flex flex-wrap items-center justify-center gap-5"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <span
            className="rounded-[20px] bg-[#12B2C5] px-5 py-[3px] text-base font-medium text-white"
            style={{
              borderRadius: 20,
              backgroundColor: "#12B2C5",
              padding: "3px 20px",
              fontSize: 16,
              fontWeight: 500,
              color: "#ffffff",
            }}
          >
            {item.statusLabel}
          </span>
          <MetaItem icon="org" text={item.detail.organization} />
          <MetaItem icon="date" text={item.detail.publishedDate} />
          <CopyLinkButton />
        </div>
      </section>

      <section
        className="flex flex-col gap-[30px] px-20 py-[50px]"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          padding: "50px 80px",
        }}
      >
        <div
          className="relative h-[640px] w-full overflow-hidden rounded-2xl"
          style={{
            height: 640,
            width: "100%",
            borderRadius: 16,
            background: item.imageSrc ? undefined : HERO_GRADIENT[item.imageVariant],
            flexShrink: 0,
          }}
          role="img"
          aria-label={item.detail.fullTitle}
        >
          {item.imageSrc && (
            <Image
              src={item.imageSrc}
              alt={item.detail.fullTitle}
              fill
              sizes="1280px"
              priority
              className="object-cover"
              unoptimized={item.imageSrc.startsWith("http")}
            />
          )}
        </div>

        <div className="flex flex-col gap-10" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div
            className="space-y-5 text-lg leading-relaxed text-brand-dark"
            style={{ fontSize: 18, lineHeight: 1.625, color: "#25324B" }}
          >
            {item.detail.bodySections.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} style={{ margin: "0 0 20px", whiteSpace: "pre-line" }}>
                {paragraph}
              </p>
            ))}

            {item.detail.bulletGroups?.map((group) => (
              <ul
                key={group.items[0]}
                className="list-disc space-y-2 pl-6"
                style={{ margin: "0 0 20px", paddingLeft: 24, listStyleType: "disc" }}
              >
                {group.items.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: 8 }}>
                    {bullet}
                  </li>
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
              <p style={{ whiteSpace: "pre-line" }}>
                การประกาศผลการพิจารณา — {item.detail.closingNote}{" "}
                <a
                  href={item.detail.nrctUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-dark underline"
                  style={{ color: "#25324B", textDecoration: "underline" }}
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

          {item.detail.attachments.length > 0 && (
            <>
              <div className="flex items-center gap-[3px]" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <DownloadIcon />
                <span
                  className="text-[25px] font-semibold text-brand-dark"
                  style={{ fontSize: 25, fontWeight: 600, color: "#25324B" }}
                >
                  {item.detail.downloadLabel}
                </span>
              </div>

              <div
                className="flex flex-wrap gap-5"
                style={{ display: "flex", flexWrap: "wrap", gap: 20 }}
              >
                {item.detail.attachments.map((file) => (
                  <AttachmentCard key={file.id} file={file} />
                ))}
              </div>
            </>
          )}

          <DetailPagination
            page={page}
            totalPages={totalPages}
            prevId={prevId}
            nextId={nextId}
          />
        </div>
      </section>
    </>
  );
}
