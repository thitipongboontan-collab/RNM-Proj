export const ACADEMIC_TITLE_PATTERNS = [
  { match: "รศ.ดร.", label: "รศ.ดร." },
  { match: "ผศ.ดร.", label: "ผศ.ดร." },
  { match: "ศ.ดร.", label: "ศ.ดร." },
  { match: "อาจารย์ ดร.", label: "อาจารย์ ดร." },
  { match: "อาจารย์", label: "อาจารย์" },
] as const;

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractAcademicTitle(nameTh: string): string | null {
  for (const pattern of ACADEMIC_TITLE_PATTERNS) {
    if (nameTh.includes(pattern.match)) return pattern.label;
  }
  return null;
}

export function detectRequestedTitles(message: string): string[] {
  const normalized = normalizeText(message);
  const requested = new Set<string>();

  for (const pattern of ACADEMIC_TITLE_PATTERNS) {
    if (normalized.includes(normalizeText(pattern.match))) {
      requested.add(pattern.label);
    }
  }

  if (
    (normalized.includes("ผู้ช่วยศาสตราจารย์") || /\bผศ\b/.test(normalized)) &&
    !normalized.includes("รศ")
  ) {
    requested.add("ผศ.ดร.");
  }

  if (
    (normalized.includes("รองศาสตราจารย์") || /\bรศ\b/.test(normalized)) &&
    !normalized.includes("ผศ")
  ) {
    requested.add("รศ.ดร.");
  }

  if (
    normalized.includes("ศาสตราจารย์") &&
    !normalized.includes("ผู้ช่วย") &&
    !normalized.includes("รอง")
  ) {
    requested.add("ศ.ดร.");
  }

  return [...requested];
}

export function isAggregateCountQuestion(message: string): boolean {
  const normalized = normalizeText(message);
  const asksForCount =
    /(กี่คน|จำนวน|ทั้งหมด|เท่าไร|เท่าไหร่|กี่ราย|how many|count|total)/.test(normalized);
  const aboutResearchers =
    normalized.includes("นักวิจัย") ||
    normalized.includes("researcher") ||
    detectRequestedTitles(message).length > 0 ||
    /ผศ|รศ|ศ\.ดร|อาจารย์|ดร\./.test(normalized);

  return asksForCount && aboutResearchers;
}

export function buildTitleSummary(
  researchers: { row: { name_th: string } }[],
): string {
  const counts = new Map<string, number>();
  for (const pattern of ACADEMIC_TITLE_PATTERNS) counts.set(pattern.label, 0);
  counts.set("ไม่ระบุ", 0);

  for (const record of researchers) {
    const title = extractAcademicTitle(record.row.name_th);
    if (title) counts.set(title, (counts.get(title) ?? 0) + 1);
    else counts.set("ไม่ระบุ", (counts.get("ไม่ระบุ") ?? 0) + 1);
  }

  return [...ACADEMIC_TITLE_PATTERNS.map((pattern) => pattern.label), "ไม่ระบุ"]
    .map((label) => `- ${label}: ${counts.get(label) ?? 0} คน`)
    .join("\n");
}

export function filterResearchersByTitles<T extends { row: { name_th: string } }>(
  records: T[],
  titles: string[],
): T[] {
  if (!titles.length) return [];

  return records.filter((record) => {
    const title = extractAcademicTitle(record.row.name_th);
    return title ? titles.includes(title) : false;
  });
}

export function detectDepartmentFilter(
  message: string,
  departments: string[],
): string | undefined {
  const normalized = normalizeText(message);
  return departments.find((department) => normalized.includes(normalizeText(department)));
}

export function extractResearcherId(message: string): string | undefined {
  const match = message.match(/\b(RS\d{3})\b/i);
  return match?.[1]?.toUpperCase();
}

export function stripAcademicTitlePrefix(nameTh: string): string {
  return nameTh
    .replace(/^(รศ\.ดร\.|ผศ\.ดร\.|ศ\.ดร\.|อาจารย์ ดร\.|อาจารย์)\s*/, "")
    .trim();
}

type ResearcherIdentity = {
  row: { researcher_id: string; name_th: string; name_en: string | null };
};

export function findResearchersByNameQuery(
  message: string,
  researchers: ResearcherIdentity[],
  limit = 3,
): string[] {
  const idFromMessage = extractResearcherId(message);
  if (idFromMessage) return [idFromMessage];

  const normalized = normalizeText(message);
  const scored = researchers
    .map((record) => {
      const bareName = normalizeText(stripAcademicTitlePrefix(record.row.name_th));
      const fullName = normalizeText(record.row.name_th);
      const nameEn = record.row.name_en ? normalizeText(record.row.name_en) : "";

      let score = 0;
      if (normalized.includes(fullName) || normalized.includes(bareName)) score += 100;
      if (nameEn && normalized.includes(nameEn)) score += 80;

      for (const part of bareName.split(/\s+/).filter((token) => token.length >= 2)) {
        if (normalized.includes(part)) score += 5;
      }
      if (nameEn) {
        for (const part of nameEn.split(/\s+/).filter((token) => token.length >= 3)) {
          if (normalized.includes(part)) score += 4;
        }
      }

      return { id: record.row.researcher_id, score };
    })
    .filter((item) => item.score >= 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.id);
}
