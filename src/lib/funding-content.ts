import type { FundingDetailContent } from "@/data/funding";

const NUMBERED_ITEM_PATTERN = /^(วช\.|นักวิจัย|หน่วยงาน)/;

export function parseFundingDetails(
  text: string,
  sourceUrl?: string,
): Pick<
  FundingDetailContent,
  "bodySections" | "bulletGroups" | "numberedList" | "closingNote" | "nriisUrl" | "nrctUrl"
> {
  const blocks = text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const bodySections: string[] = [];
  const bulletItems: string[] = [];
  let numberedTitle = "";
  const numberedItems: string[] = [];
  let closingNote = "";
  let afterNumberedTitle = false;

  for (const block of blocks) {
    if (block === "การเปิดรับข้อเสนอการวิจัยและนวัตกรรม") {
      numberedTitle = block;
      afterNumberedTitle = true;
      continue;
    }

    if (afterNumberedTitle && !closingNote) {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.every((line) => NUMBERED_ITEM_PATTERN.test(line))) {
        numberedItems.push(...lines);
        continue;
      }
      afterNumberedTitle = false;
    }

    if (block.startsWith("การประกาศผลการพิจารณา")) {
      closingNote = block.replace(/^การประกาศผลการพิจารณา\s*/u, "").trim();
      continue;
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const bullets = lines.filter((line) => line.startsWith("กลุ่มเรื่อง"));
    const paragraphs = lines.filter((line) => !line.startsWith("กลุ่มเรื่อง"));

    if (bullets.length) {
      bulletItems.push(...bullets);
    }

    if (paragraphs.length) {
      bodySections.push(paragraphs.join("\n"));
    }
  }

  const nriisUrl = sourceUrl?.includes("nriis.go.th")
    ? sourceUrl
    : "https://nriis.go.th";

  return {
    bodySections,
    bulletGroups: bulletItems.length ? [{ items: bulletItems }] : undefined,
    numberedList:
      numberedTitle && numberedItems.length
        ? { title: numberedTitle, items: numberedItems }
        : undefined,
    closingNote: closingNote || undefined,
    nriisUrl,
    nrctUrl: "https://www.nrct.go.th",
  };
}
