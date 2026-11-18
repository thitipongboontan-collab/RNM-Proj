import { expandQueryTokens, expandSynonymTerms, normalizeTopicQueryText } from "@/lib/ai/text-utils";
import type { Citation, ResearcherFilters, ToolExecutionResult } from "@/lib/ai/types";
import type { ResearcherRecord } from "@/lib/assistant-context";

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
  const segment = normalizeTopicQueryText(topicMatch?.[1] ?? message);
  const tokens = new Set<string>();

  for (const part of segment.replace(/[''’]/g, " ").split(/[^a-z0-9\u0E00-\u0E7F]+/i)) {
    if (part.length >= 2 && !STOP_WORDS.has(part)) tokens.add(part);
  }

  for (const token of expandQueryTokens(message)) {
    if (token.length >= 2 && !STOP_WORDS.has(token)) tokens.add(token);
  }

  return [...tokens];
}

export function extractPublicationTopicPhrases(message: string): string[] {
  const topicMatch = message.match(
    /(?:เกี่ยวกับ|เรื่อง|about|on|regarding|with)\s+(.+?)(?:\s*(?:บ้าง|ไหม|หรือไม่)|$)/i,
  );
  if (!topicMatch?.[1]) return [];

  const phrase = normalizeTopicQueryText(topicMatch[1].replace(/[''’]/g, " ")).replace(/\bwomen s\b/, "women");
  if (phrase.length < 3) return [];

  const phrases = [phrase, ...expandSynonymTerms(phrase)];
  if (phrase.includes("women s")) {
    phrases.push(phrase.replace("women s", "women"));
  }
  if (phrase.includes("hmong women")) {
    phrases.push("hmong women");
  }

  return [...new Set(phrases.filter((item) => item.length >= 3))];
}

function normalizeTopicMatchText(text: string): string {
  return normalizeTopicQueryText(text.replace(/[''’]/g, " "));
}

function scorePublicationTitle(
  title: string,
  tokens: string[],
  phrases: string[],
): number {
  const titleNorm = normalizeTopicMatchText(title);
  let score = 0;

  for (const token of tokens) {
    const tokenNorm = normalizeTopicMatchText(token);
    if (tokenNorm.length < 2) continue;
    if (titleNorm.includes(tokenNorm)) score += tokenNorm.length >= 5 ? 12 : 8;
  }
  for (const phrase of phrases) {
    const phraseNorm = normalizeTopicMatchText(phrase);
    if (phraseNorm.length < 3) continue;
    if (titleNorm.includes(phraseNorm)) score += 35;
  }

  return score;
}

function scoreKeywordMatch(record: ResearcherRecord, tokens: string[], phrases: string[]): number {
  let score = 0;
  const keywordText = normalizeTopicMatchText(record.keywords.map((item) => item.keyword).join(" "));
  const expertiseText = normalizeTopicMatchText(record.expertise.map((item) => item.expertise).join(" "));

  for (const token of tokens) {
    const tokenNorm = normalizeTopicMatchText(token);
    if (tokenNorm.length < 2) continue;
    if (keywordText.includes(tokenNorm)) score += 6;
    if (expertiseText.includes(tokenNorm)) score += 4;
  }
  for (const phrase of phrases) {
    const phraseNorm = normalizeTopicMatchText(phrase);
    if (phraseNorm.length < 3) continue;
    if (keywordText.includes(phraseNorm)) score += 15;
    if (expertiseText.includes(phraseNorm)) score += 10;
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

      const matchedProjects = (record.projects ?? [])
        .map((project) => ({
          project,
          score: scorePublicationTitle(project.project_name, tokens, phrases),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      const publicationScore = matchedPublications.reduce((sum, item) => sum + item.score, 0);
      const projectScore = matchedProjects.reduce((sum, item) => sum + item.score, 0);
      const keywordScore = scoreKeywordMatch(record, tokens, phrases);
      const outputScore = publicationScore + projectScore;
      const totalScore = outputScore + keywordScore;

      return {
        record,
        matchedPublications: matchedPublications.slice(0, 5),
        matchedProjects: matchedProjects.slice(0, 5),
        totalScore,
        publicationScore: outputScore,
      };
    })
    .filter((item) => item.publicationScore > 0)
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
    const pubLines = item.matchedPublications.map(
      ({ publication }) =>
        `    - ${publication.title}${publication.year ? ` (${publication.year})` : ""}`,
    );
    const projectLines = item.matchedProjects.map(
      ({ project }) =>
        `    - ${project.project_name}${project.fiscal_year_be ? ` (ปีงบประมาณ ${project.fiscal_year_be})` : ""}`,
    );

    return [
      `[${row.researcher_id}] ${row.name_th}${row.name_en ? ` (${row.name_en})` : ""}`,
      item.matchedPublications.length ? `  ผลงานตีพิมพ์ที่ตรงหัวข้อ:` : "",
      ...pubLines,
      item.matchedProjects.length ? `  โครงการวิจัยที่ตรงหัวข้อ:` : "",
      ...projectLines,
      `  ลิงก์: /researchers/${row.researcher_id}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return {
    name: "search_by_publication",
    summary: `พบ ${ranked.length} นักวิจัยจากผลงานตีพิมพ์หรือโครงการวิจัยที่ตรงหัวข้อ`,
    contextBlock: [
      "=== TOOL: search_by_publication (ค้นจาก publications + projects + keywords ด้วยคำใกล้เคียงไทย/อังกฤษ) ===",
      `หัวข้อที่ค้น: ${phrases.join(" | ") || tokens.join(", ")}`,
      `จำนวนที่พบ: ${ranked.length} คน`,
      "",
      "แสดงเฉพาะชื่อนักวิจัยกับชื่อผลงาน/โครงการที่ตรงหัวข้อ — ห้ามใช้จำนวนผลงานทั้งหมดมาทดแทน",
      "",
      contextLines.join("\n\n"),
    ].join("\n"),
    citations: ranked.map((item) => researcherCitation(item.record)),
  };
}
