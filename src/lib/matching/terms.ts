import { expandQueryTokens } from "@/lib/ai/text-utils";
import { normalizeMatchText } from "@/lib/matching/funding-text";

/** Tokens that appear in almost every call or paper and must not create a match by themselves. */
export const MATCH_STOPWORDS = new Set([
  "research",
  "researcher",
  "university",
  "studies",
  "study",
  "science",
  "sciences",
  "scientific",
  "international",
  "development",
  "innovation",
  "impact",
  "outputs",
  "outcome",
  "document",
  "online",
  "https",
  "http",
  "www",
  "project",
  "funding",
  "grant",
  "program",
  "programme",
  "fellowship",
  "scholarship",
  "analysis",
  "system",
  "quality",
  "based",
  "using",
  "among",
  "between",
  "through",
  "their",
  "this",
  "that",
  "from",
  "with",
  "institute",
  "college",
  "faculty",
  "department",
  "society",
  "community",
  "global",
  "health",
  "social",
  "human",
  "people",
  "year",
  "years",
  "ประกาศ",
  "สมัคร",
  "โครงการ",
  "ข้อเสนอ",
  "นวัตกรรม",
  "วิจัย",
  "ผลงาน",
  "สนับสนุน",
  "ระบบ",
  "ประจำปี",
  "งบประมาณ",
  "มหาวิทยาลัย",
  "สำนักงาน",
  "ประเทศ",
]);

const GENERIC_GEOGRAPHY = new Set([
  "thailand",
  "ไทย",
  "ประเทศไทย",
  "japan",
  "japanese",
  "india",
  "indian",
  "china",
  "chinese",
  "asia",
  "asian",
]);

const HOST_CITY_LABELS = new Set(["chiang mai", "chiangmai", "เชียงใหม่"]);

export function isGenericGeographyLabel(label: string): boolean {
  const token = normalizeMatchText(label);
  return GENERIC_GEOGRAPHY.has(token) || HOST_CITY_LABELS.has(token);
}

export function isHostCityLabel(label: string, organization: string, title: string): boolean {
  const token = normalizeMatchText(label);
  if (!HOST_CITY_LABELS.has(token)) return false;
  return /เชียงใหม่|chiang mai|cmu/i.test(`${organization} ${title}`);
}

export function isSparseCallDetails(details: string | null | undefined): boolean {
  const text = (details ?? "").trim();
  if (!text || text === "-") return true;
  if (/(กลุ่มเรื่อง|คุณสมบัติ|ผู้สมัคร|คณาจารย์|นักศึกษา|มหาบัณฑิต|แผนงานย่อย|eligible)/i.test(text)) return false;
  return text.length < 80;
}

const THAI_TOPIC_STEMS = [
  "เกษตร",
  "มลพิษอากาศ",
  "มลพิษ",
  "หมอกควัน",
  "ฝุ่นละออง",
  "ชาติพันธุ์",
  "ผู้สูงอายุ",
  "ธรรมาภิบาล",
  "ภูมิอากาศ",
  "ภัยพิบัติ",
  "พื้นที่สูง",
  "สิ่งแวดล้อม",
  "ความมั่นคงทางอาหาร",
];

function extraStems(label: string): string[] {
  const normalized = normalizeMatchText(label);
  const stems: string[] = [];
  if (/(^|[^a-z])(agriculture|farming|rice)($|[^a-z])/.test(normalized) || /เกษตร|พืชไร่/.test(normalized)) {
    stems.push("เกษตร", "agriculture", "farming");
  }
  for (const stem of THAI_TOPIC_STEMS) {
    if (normalized.includes(stem)) stems.push(stem);
  }
  return stems;
}

export function distinctiveTokens(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const term of terms) {
    const token = normalizeMatchText(term);
    if (!token) continue;
    const thai = /[\u0E00-\u0E7F]/.test(token);
    if (thai ? token.length < 4 : token.length < 5) continue;
    if (MATCH_STOPWORDS.has(token) || GENERIC_GEOGRAPHY.has(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    result.push(token);
  }
  return result;
}

export function labelHits(haystack: string, label: string): string[] {
  const text = normalizeMatchText(haystack);
  const normalizedLabel = normalizeMatchText(label);
  if (normalizedLabel.length >= 8 && !MATCH_STOPWORDS.has(normalizedLabel) && text.includes(normalizedLabel)) {
    return [normalizedLabel];
  }
  const tokenHits = distinctiveTokens([...expandQueryTokens(label), ...extraStems(label)]).filter((token) =>
    text.includes(token),
  );
  if (tokenHits.length) return tokenHits;
  return THAI_TOPIC_STEMS.filter((stem) => text.includes(stem) && normalizedLabel.includes(stem));
}

export function cappedContribution(weights: number[], cap: number): number {
  let total = 0;
  for (const weight of weights) total += weight;
  return Math.min(cap, total);
}
