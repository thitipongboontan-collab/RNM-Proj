export type SystemResearcher = {
  researcherId: string;
  nameTh: string;
  nameEn: string;
};

export type ProjectResearcherRole = "principal" | "collaborator";

export type MatchedProjectResearcher = {
  researcherId: string;
  name: string;
  role: ProjectResearcherRole;
  roleLabel: string;
};

function stripAcademicTitles(value: string): string {
  let result = value.trim();
  const patterns = [
    /^(ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|อาจารย์)\s+/,
    /^(ศ\.|รศ\.|ผศ\.|อ\.|ดร\.|นพ\.|พญ\.)\s*/,
    /^(professor emeritus|associate\s+prof\.?|assistant\s+prof\.?|assoc\.\s*prof\.?|prof\.?|dr\.?)\s*/i,
    /^นาย\s+/,
    /^นางสาว\s+/,
    /^นาง\s+/,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of patterns) {
      const next = result.replace(pattern, "").trim();
      if (next !== result) {
        result = next;
        changed = true;
      }
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

export function normalizeResearcherName(value: string | null | undefined): string {
  return stripAcademicTitles(String(value ?? ""))
    .replace(/^นาย\s+/g, "")
    .replace(/^นางสาว\s+/g, "")
    .replace(/^นาง\s+/g, "")
    .toLowerCase();
}

export function splitNamedPeople(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(
    String(value)
      .split(/\s*(?:,|;|\/|\n|\r| และ | & )\s*/g)
      .map((part) => part.trim())
      .filter(Boolean),
  )];
}

function registerAlias(map: Map<string, SystemResearcher>, alias: string, researcher: SystemResearcher) {
  const normalized = normalizeResearcherName(alias);
  if (!normalized) return;

  map.set(normalized, researcher);

  if (alias.includes(",")) {
    const [last, first] = alias.split(",").map((part) => part.trim());
    if (first && last) {
      map.set(normalizeResearcherName(`${first} ${last}`), researcher);
      map.set(normalizeResearcherName(`${last} ${first}`), researcher);
    }
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    map.set(tokens.join(" "), researcher);
    map.set([...tokens].reverse().join(" "), researcher);
  }
}

export function buildResearcherLookup(researchers: SystemResearcher[]): Map<string, SystemResearcher> {
  const map = new Map<string, SystemResearcher>();
  for (const researcher of researchers) {
    registerAlias(map, researcher.nameTh, researcher);
    registerAlias(map, researcher.nameEn, researcher);
  }
  return map;
}

function lookupPerson(
  lookup: Map<string, SystemResearcher>,
  name: string,
): SystemResearcher | null {
  return lookup.get(normalizeResearcherName(name)) ?? null;
}

export function matchProjectResearchers(input: {
  principalInvestigator: string | null | undefined;
  coInvestigators: string | null | undefined;
  lookup: Map<string, SystemResearcher>;
}): MatchedProjectResearcher[] {
  const matched = new Map<string, MatchedProjectResearcher>();

  for (const name of splitNamedPeople(input.principalInvestigator)) {
    const researcher = lookupPerson(input.lookup, name);
    if (!researcher) continue;
    matched.set(researcher.researcherId, {
      researcherId: researcher.researcherId,
      name: researcher.nameTh || researcher.nameEn || name,
      role: "principal",
      roleLabel: "หัวหน้าโครงการ",
    });
  }

  for (const name of splitNamedPeople(input.coInvestigators)) {
    const researcher = lookupPerson(input.lookup, name);
    if (!researcher || matched.has(researcher.researcherId)) continue;
    matched.set(researcher.researcherId, {
      researcherId: researcher.researcherId,
      name: researcher.nameTh || researcher.nameEn || name,
      role: "collaborator",
      roleLabel: "ผู้ร่วมโครงการ",
    });
  }

  return [...matched.values()];
}
