import { normalizeText } from "@/lib/ai/researcher-meta";

export const QUERY_SYNONYMS: Record<string, string[]> = {
  pm25: ["pm2.5", "pm 2.5", "pm-2.5", "ฝุ่น", "ฝุ่นละออง", "มลพิษอากาศ", "air pollution", "haze", "หมอกควัน"],
  migration: ["migration", "migration studies", "การย้ายถิ่น", "ผู้อพยพ", "immigrant"],
  funding: ["ทุน", "แหล่งทุน", "funding", "grant", "เปิดรับ", "nrct", "nriis"],
  social: ["สังคม", "social", "ความมั่นคง", "security"],
  environment: ["สิ่งแวดล้อม", "environment", "environmental", "climate", "ภูมิอากาศ"],
  researcher: ["นักวิจัย", "researcher", "อาจารย์", "ผศ", "รศ", "ดร"],
};

export function expandQueryTokens(message: string): string[] {
  const normalized = normalizeText(message);
  const tokens = new Set<string>();

  for (const part of normalized.split(/[^a-z0-9\u0E00-\u0E7F]+/i)) {
    if (part.length >= 2) tokens.add(part);
  }

  for (const [key, synonyms] of Object.entries(QUERY_SYNONYMS)) {
    if (synonyms.some((term) => normalized.includes(normalizeText(term)))) {
      tokens.add(key);
      for (const synonym of synonyms) tokens.add(normalizeText(synonym));
    }
  }

  return [...tokens];
}

export function scoreText(searchText: string, queryTokens: string[]): number {
  if (!queryTokens.length) return 0;

  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (searchText.includes(token)) score += token.length >= 5 ? 8 : 4;
  }
  return score;
}

export function truncate(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

export function isFundingQuestion(message: string, queryTokens: string[]): boolean {
  const normalized = normalizeText(message);
  return (
    queryTokens.some((token) => QUERY_SYNONYMS.funding.includes(token) || token.includes("ทุน")) ||
    normalized.includes("ทุน") ||
    normalized.includes("funding") ||
    normalized.includes("grant")
  );
}

export function isResearcherQuestion(message: string, queryTokens: string[]): boolean {
  const normalized = normalizeText(message);
  return (
    queryTokens.some((token) => QUERY_SYNONYMS.researcher.includes(token)) ||
    normalized.includes("นักวิจัย") ||
    normalized.includes("researcher")
  );
}

export function isMatchFundingQuestion(message: string): boolean {
  const normalized = normalizeText(message);
  return (
    /(แนะนำทุน|ทุนที่เหมาะ|match|matching|จับคู่|เหมาะกับ|ควรสมัครทุน|หาทุน|smart match)/.test(
      normalized,
    ) &&
    (normalized.includes("นักวิจัย") ||
      normalized.includes("researcher") ||
      /\bRS\d{3}\b/i.test(message) ||
      normalized.includes("ฉัน") ||
      normalized.includes("ผม"))
  );
}

export function isCollaborationQuestion(message: string): boolean {
  const normalized = normalizeText(message);
  return (
    /(เครือข่าย|collaboration|network|ความร่วมมือ|co-?author|ร่วมวิจัย|ทีมวิจัย|team)/.test(
      normalized,
    ) && (normalized.includes("นักวิจัย") || /\bRS\d{3}\b/i.test(message))
  );
}

export function isPublicationTrendQuestion(message: string): boolean {
  const normalized = normalizeText(message);
  return (
    /(แนวโน้ม|trend|เทรนด์|ต่อปี|รายปี|publication trend|ผลงานต่อปี|ช่วง.*ปี)/.test(
      normalized,
    ) || (normalized.includes("ผลงาน") && /(กี่|จำนวน|ปี)/.test(normalized))
  );
}

export function isIntelligenceProfileQuestion(message: string): boolean {
  const normalized = normalizeText(message);
  return (
    /(research intelligence|intelligence|วิเคราะห์โปรไฟล์|impact score|ศักยภาพวิจัย|จุดแข็ง)/.test(
      normalized,
    ) && (normalized.includes("นักวิจัย") || /\bRS\d{3}\b/i.test(message))
  );
}
