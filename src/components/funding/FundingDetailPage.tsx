import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CopyLinkButton } from "@/components/funding/CopyLinkButton";
import {
  AttachmentCard,
  DetailPagination,
  DownloadIcon,
  MetaItem,
} from "@/components/funding/FundingDetailParts";
import {
  FUNDING_ITEMS,
  getFundingIndex,
  HERO_GRADIENT,
  type FundingItem,
} from "@/data/funding";

export function FundingDetailPage({ item }: { item: FundingItem }) {
  const index = getFundingIndex(item.id);
  const prevId = index > 0 ? FUNDING_ITEMS[index - 1]?.id : undefined;
  const nextId =
    index >= 0 && index < FUNDING_ITEMS.length - 1
      ? FUNDING_ITEMS[index + 1]?.id
      : undefined;

  return (
    <PageShell>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แหล่งทุน", href: "/funding" },
          { label: "รายละเอียดแหล่งทุน" },
        ]}
      />

      {/* Figma Frame 39788 — title + meta */}
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

      {/* Figma Frame 39789 — hero + body */}
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
          className="h-[640px] w-full rounded-2xl"
          style={{
            height: 640,
            width: "100%",
            borderRadius: 16,
            background: HERO_GRADIENT[item.imageVariant],
            flexShrink: 0,
          }}
          role="img"
          aria-label={item.detail.fullTitle}
        />

        <div className="flex flex-col gap-10" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div
            className="space-y-5 text-lg leading-relaxed text-brand-dark"
            style={{ fontSize: 18, lineHeight: 1.625, color: "#25324B" }}
          >
            {item.detail.bodySections.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} style={{ margin: "0 0 20px" }}>
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

            <p style={{ margin: "0 0 20px" }}>
              การส่งข้อเสนอการวิจัยและนวัตกรรม — ขอให้ลงทะเบียนส่งข้อเสนอการวิจัยและนวัตกรรม
              ที่เว็บไซต์{" "}
              <a
                href={item.detail.nriisUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-dark underline"
                style={{ color: "#25324B", textDecoration: "underline" }}
              >
                {item.detail.nriisUrl}
              </a>{" "}
              โดยเลือกกลุ่มเรื่องประเด็น/หัวข้อการวิจัย ที่ต้องการรับทุน
            </p>

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
              <p>
                การประกาศผลการพิจารณา — วช. จะประกาศผลการพิจารณาข้อเสนอการวิจัยและนวัตกรรมที่ผ่านการพิจารณาเบื้องต้นทางเว็บไซต์{" "}
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

          <DetailPagination prevId={prevId} nextId={nextId} />
        </div>
      </section>
    </PageShell>
  );
}
