import type { PublicationTrendPoint, TopicTrend } from "@/lib/ai/intelligence/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "study",
  "analysis",
  "research",
  "case",
  "review",
  "thailand",
  "thai",
]);

export function buildPublicationTrendByYear(
  researchers: ResearcherRecord[],
): PublicationTrendPoint[] {
  const counts = new Map<number, number>();

  for (const record of researchers) {
    for (const publication of record.publications) {
      if (!publication.year) continue;
      counts.set(publication.year, (counts.get(publication.year) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }));
}

export function buildTopTopics(researchers: ResearcherRecord[], limit = 12): TopicTrend[] {
  const counts = new Map<string, number>();

  for (const record of researchers) {
    for (const keyword of record.keywords) {
      if (keyword.keyword_type !== "keyword_en") continue;
      const topic = keyword.keyword.trim();
      if (topic.length < 3) continue;
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }

    for (const publication of record.publications) {
      for (const token of publication.title.toLowerCase().split(/[^a-z]+/i)) {
        if (token.length < 4 || STOP_WORDS.has(token)) continue;
        counts.set(token, (counts.get(token) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, count }));
}

export function buildResearcherPublicationTrend(record: ResearcherRecord): PublicationTrendPoint[] {
  const counts = new Map<number, number>();

  for (const publication of record.publications) {
    if (!publication.year) continue;
    counts.set(publication.year, (counts.get(publication.year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year, count }));
}

export function formatPublicationTrendBlock(
  facultyTrend: PublicationTrendPoint[],
  topTopics: TopicTrend[],
  researcherTrend?: PublicationTrendPoint[],
  researcherId?: string,
): string {
  const lines = [
    "=== TOOL: publication_trends ===",
    "=== แนวโน้มผลงานทั้งคณะ (ต่อปี) ===",
    facultyTrend.length
      ? facultyTrend.map((point) => `- ${point.year}: ${point.count} รายการ`).join("\n")
      : "- ไม่มีข้อมูล",
    "",
    "=== หัวข้อยอดนิยมในคณะ ===",
    topTopics.length
      ? topTopics.map((item) => `- ${item.topic}: ${item.count}`).join("\n")
      : "- ไม่มีข้อมูล",
  ];

  if (researcherTrend && researcherId) {
    lines.push(
      "",
      `=== แนวโน้มผลงาน ${researcherId} ===`,
      researcherTrend.length
        ? researcherTrend.map((point) => `- ${point.year}: ${point.count} รายการ`).join("\n")
        : "- ไม่มีข้อมูล",
    );
  }

  return lines.join("\n");
}
