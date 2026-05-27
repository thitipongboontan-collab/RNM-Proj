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
