import { extractAcademicTitle, normalizeText } from "@/lib/ai/researcher-meta";
import type { Citation, ResearcherFilters, ToolExecutionResult } from "@/lib/ai/types";
import type { ResearcherRecord } from "@/lib/assistant-context";
import { formatResearcherDetail } from "@/lib/ai/tools/researchers";

const STOP_WORDS = new Set([
  "มี",
  "นักวิจัย",
  "คนไหน",
  "คน",
  "ใคร",
  "ผลงาน",
  "เกี่ยวกับ",
  "เรื่อง",
  "บ้าง",
  "ไหม",
  "หรือ",
  "และ",
  "the",
  "and",
  "of",
  "a",
  "an",
  "in",
  "on",
  "about",
  "who",
  "which",
  "researcher",
  "researchers",
  "publication",
  "publications",
  "paper",
  "papers",
  "article",
  "articles",
  "งานวิจัย",
  "ตีพิมพ์",
]);

function researcherCitation(record: ResearcherRecord): Citation {
  return {
    id: record.row.researcher_id,
    type: "researcher",
    label: record.row.name_th,
    href: `/researchers/${record.row.researcher_id}`,
  };
}

function applyFilters(records: ResearcherRecord[], filters: ResearcherFilters): ResearcherRecord[] {
  let filtered = records;
  if (filters.department) {
    filtered = filtered.filter((record) => record.row.department === filters.department);
  }
  if (filters.researcherId) {
    filtered = filtered.filter((record) => record.row.researcher_id === filters.researcherId);
  }
  return filtered;
}

export function extractPublicationTopicTokens(message: string): string[] {
  const topicMatch = message.match(
    /(?:เกี่ยวกับ|เรื่อง|about|on|regarding|with)\s+(.+?)(?:\s*(?:บ้าง|ไหม|หรือไม่)|$)/i,
  );
  const segment = topicMatch?.[1] ?? message;
  const tokens = new Set<string>();

  for (const part of normalizeText(segment.replace(/[''’]/g, " ")).split(/[^a-z0-9\u0E00-\u0E7F]+/i)) {
    if (part.length >= 3 && !STOP_WORDS.has(part)) tokens.add(part);
  }

  return [...tokens];
}

export function extractPublicationTopicPhrases(message: string): string[] {
  const topicMatch = message.match(
    /(?:เกี่ยวกับ|เรื่อง|about|on|regarding|with)\s+(.+?)(?:\s*(?:บ้าง|ไหม|หรือไม่)|$)/i,
  );
  if (!topicMatch?.[1]) return [];

  const phrase = normalizeText(topicMatch[1].replace(/[''’]/g, " ")).replace(/\bwomen s\b/, "women");
  if (phrase.length < 4) return [];

  const phrases = [phrase];
  if (phrase.includes("women s")) {
    phrases.push(phrase.replace("women s", "women"));
  }
  if (phrase.includes("hmong women")) {
    phrases.push("hmong women");
  }

  return [...new Set(phrases)];
}

function scorePublicationTitle(
  title: string,
  tokens: string[],
  phrases: string[],
): number {
  const titleNorm = normalizeText(title.replace(/[''’]/g, " "));
  let score = 0;

  for (const token of tokens) {
    if (titleNorm.includes(token)) score += token.length >= 5 ? 12 : 8;
  }
  for (const phrase of phrases) {
    if (titleNorm.includes(phrase)) score += 35;
  }

  return score;
}

function scoreKeywordMatch(record: ResearcherRecord, tokens: string[], phrases: string[]): number {
  let score = 0;
  const keywordText = normalizeText(record.keywords.map((item) => item.keyword).join(" "));
  const expertiseText = normalizeText(record.expertise.map((item) => item.expertise).join(" "));

  for (const token of tokens) {
    if (keywordText.includes(token)) score += 6;
    if (expertiseText.includes(token)) score += 4;
  }
  for (const phrase of phrases) {
    if (keywordText.includes(phrase)) score += 15;
    if (expertiseText.includes(phrase)) score += 10;
  }

  return score;
}

export function searchResearchersByPublicationTool(
  records: ResearcherRecord[],
  message: string,
  filters: ResearcherFilters,
  limit = 8,
): ToolExecutionResult | null {
  const tokens = extractPublicationTopicTokens(message);
  const phrases = extractPublicationTopicPhrases(message);
  if (!tokens.length && !phrases.length) return null;

  const pool = applyFilters(records, filters);

  const ranked = pool
    .map((record) => {
      const matchedPublications = record.publications
        .map((publication) => ({
          publication,
          score: scorePublicationTitle(publication.title, tokens, phrases),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || (b.publication.year ?? 0) - (a.publication.year ?? 0));

      const publicationScore = matchedPublications.reduce((sum, item) => sum + item.score, 0);
      const keywordScore = scoreKeywordMatch(record, tokens, phrases);
      const totalScore = publicationScore + keywordScore;

      return { record, matchedPublications, totalScore, publicationScore };
    })
    .filter((item) => item.totalScore > 0)
    .sort((a, b) => {
      if (b.publicationScore !== a.publicationScore) {
        return b.publicationScore - a.publicationScore;
      }
      return b.totalScore - a.totalScore;
    })
    .slice(0, limit);

  if (!ranked.length) return null;

  const contextLines = ranked.map((item) => {
    const { row } = item.record;
    const title = extractAcademicTitle(row.name_th);
    const pubLines = item.matchedPublications.map(
      ({ publication }) =>
        `    - ${publication.title}${publication.year ? ` (${publication.year})` : ""}`,
    );

    return [
      `[${row.researcher_id}] ${row.name_th}${row.name_en ? ` (${row.name_en})` : ""}`,
      `  ตำแหน่ง: ${title ?? "ไม่ระบุ"}`,
      `  หน่วยงาน: ${row.department}`,
      `  ผลงานที่ตรงหัวข้อ (${item.matchedPublications.length} รายการ):`,
      ...pubLines,
      `  ลิงก์: /researchers/${row.researcher_id}`,
    ].join("\n");
  });

  return {
    name: "search_by_publication",
    summary: `พบ ${ranked.length} นักวิจัยจากผลงานตีพิมพ์ที่ตรงหัวข้อ`,
    contextBlock: [
      "=== TOOL: search_by_publication (ค้นจาก publications.title + keywords/expertise) ===",
      `หัวข้อที่ค้น: ${phrases.join(" | ") || tokens.join(", ")}`,
      `จำนวนที่พบ: ${ranked.length} คน`,
      "",
      contextLines.join("\n\n"),
      "",
      "=== โปรไฟล์เต็มของผู้ที่พบ ===",
      ranked.map((item) => formatResearcherDetail(item.record)).join("\n\n"),
    ].join("\n"),
    citations: ranked.map((item) => researcherCitation(item.record)),
  };
}
