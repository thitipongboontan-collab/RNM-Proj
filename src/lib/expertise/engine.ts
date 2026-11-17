import {
  CONFIDENCE_METHOD,
  DETERMINISTIC_MODEL_VERSION,
  type EvidenceSourceKind,
  type EvidenceStrength,
  type ExpertiseEvidence,
  type ExpertiseProfile,
  type ExpertiseSourceRecord,
  type ExpertiseTopic,
} from "@/lib/expertise/types";

const LATIN_STOPWORDS = new Set([
  "about",
  "after",
  "among",
  "analysis",
  "and",
  "approach",
  "approaches",
  "article",
  "based",
  "between",
  "case",
  "effect",
  "effects",
  "for",
  "from",
  "impact",
  "into",
  "journal",
  "over",
  "paper",
  "research",
  "review",
  "role",
  "study",
  "studies",
  "systematic",
  "that",
  "their",
  "this",
  "through",
  "toward",
  "towards",
  "using",
  "with",
  "within",
]);

const METHOD_LEXICON: Array<{ label: string; patterns: string[] }> = [
  { label: "Qualitative Research", patterns: ["qualitative", "เชิงคุณภาพ"] },
  { label: "Quantitative Research", patterns: ["quantitative", "เชิงปริมาณ"] },
  { label: "Mixed Methods", patterns: ["mixed method", "mixed-method"] },
  { label: "Participatory Action Research", patterns: ["participatory action", "action research", "วิจัยเชิงปฏิบัติการ"] },
  { label: "Ethnography", patterns: ["ethnograph", "ชาติพันธุ์วรรณา"] },
  { label: "Interview Study", patterns: ["interview", "สัมภาษณ์"] },
  { label: "Survey Research", patterns: ["survey", "questionnaire", "แบบสำรวจ", "แบบสอบถาม"] },
  { label: "Case Study", patterns: ["case study", "กรณีศึกษา"] },
  { label: "Content Analysis", patterns: ["content analysis", "วิเคราะห์เนื้อหา"] },
  { label: "GIS and Spatial Analysis", patterns: ["geographic information", "ระบบสารสนเทศภูมิศาสตร์"] },
  { label: "Remote Sensing", patterns: ["remote sensing", "การรับรู้จากระยะไกล"] },
  { label: "Machine Learning", patterns: ["machine learning", "deep learning"] },
  { label: "Econometrics", patterns: ["econometric", "เศรษฐมิติ"] },
];

const GEOGRAPHY_LEXICON: Array<{ label: string; patterns: string[] }> = [
  { label: "Thailand", patterns: ["thailand", "ไทย"] },
  { label: "Southeast Asia", patterns: ["southeast asia", "south-east asia", "อาเซียน", "เอเชียตะวันออกเฉียงใต้"] },
  { label: "Chiang Mai", patterns: ["chiang mai", "เชียงใหม่"] },
  { label: "Mekong", patterns: ["mekong", "แม่น้ำโขง"] },
  { label: "Myanmar", patterns: ["myanmar", "burma", "เมียนมา", "พม่า"] },
  { label: "Laos", patterns: [" laos", "lao pdr", "ลาว"] },
  { label: "Cambodia", patterns: ["cambodia", "กัมพูชา"] },
  { label: "Vietnam", patterns: ["vietnam", "เวียดนาม"] },
  { label: "Global South", patterns: ["global south"] },
];

const POPULATION_LEXICON: Array<{ label: string; patterns: string[] }> = [
  { label: "Refugees", patterns: ["refugee", "ผู้ลี้ภัย"] },
  { label: "Migrant Communities", patterns: ["migrant", "migration", "ผู้อพยพ", "ผู้ย้ายถิ่น", "แรงงานข้ามชาติ"] },
  { label: "Women", patterns: ["women", "ผู้หญิง", "สตรี"] },
  { label: "Youth", patterns: ["youth", "adolescent", "เยาวชน"] },
  { label: "Older Adults", patterns: ["elderly", "older adult", "ageing", "aging", "ผู้สูงอายุ"] },
  { label: "Farmers", patterns: ["farmer", "เกษตรกร"] },
  { label: "Indigenous Communities", patterns: ["indigenous", "ethnic", "ชนเผ่า", "ชาติพันธุ์"] },
  { label: "Students", patterns: ["student", "นักเรียน", "นักศึกษา"] },
];

const DEPARTMENT_DOMAINS: Record<string, string> = {
  "ภาควิชาภูมิศาสตร์": "Geography",
  "ภาควิชาสตรีศึกษา": "Gender Studies",
  "ภาควิชาสังคมวิทยาและมานุษยวิทยา": "Sociology and Anthropology",
  "ภาควิชาสังคมศาสตร์กับการพัฒนา": "Development Studies",
};

const ALIAS_GROUPS = [
  ["pm2.5", "pm 2.5", "pm.2.5", "pm25"],
  ["การย้ายถิ่น", "migration studies"],
  ["เพศภาวะ", "gender studies"],
];

type EvidenceItem = ExpertiseEvidence & { text: string };

type TopicDraft = {
  topic: string;
  evidence: ExpertiseEvidence[];
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/pm\s*[\.\-_]?\s*2\s*[\.\-_]?\s*5/g, "pm2.5")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasKey(value: string): string {
  const normalized = normalize(value);
  for (const group of ALIAS_GROUPS) {
    if (group.some((alias) => normalized === alias)) return group[0];
  }
  return normalized;
}

function significantTokens(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9\u0E00-\u0E7F]+/i)
    .filter((token) => token.length >= 5 && !LATIN_STOPWORDS.has(token));
}

function phraseAppears(phrase: string, text: string): boolean {
  const needle = normalize(phrase);
  const haystack = normalize(text);
  if (needle.length < 5) return false;
  if (haystack.includes(needle)) return true;
  const tokens = significantTokens(needle);
  if (tokens.length < 2) return false;
  const hits = tokens.filter((token) => haystack.includes(token));
  return hits.length >= 2 && hits.length / tokens.length >= 0.5;
}

function uniqueEvidence(items: ExpertiseEvidence[]): ExpertiseEvidence[] {
  const seen = new Set<string>();
  const result: ExpertiseEvidence[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function sourceKinds(items: ExpertiseEvidence[]): EvidenceSourceKind[] {
  return [...new Set(items.map((item) => item.source))];
}

function confidenceFromSupport(support: number): number {
  const value = support / (support + 5);
  return Math.round(Math.min(0.97, value) * 100) / 100;
}

function supportOf(items: ExpertiseEvidence[]): number {
  const weights: Record<EvidenceSourceKind, number> = {
    publication: 3,
    research_project: 2.5,
    research_interest: 2,
    keyword: 1,
    academic_background: 0.5,
  };
  const caps: Record<EvidenceSourceKind, number> = {
    publication: 12,
    research_project: 10,
    research_interest: 2,
    keyword: 3,
    academic_background: 1,
  };
  const counts: Record<EvidenceSourceKind, number> = {
    publication: 0,
    research_project: 0,
    research_interest: 0,
    keyword: 0,
    academic_background: 0,
  };
  for (const item of items) counts[item.source] += 1;
  return (Object.keys(weights) as EvidenceSourceKind[]).reduce((sum, kind) => {
    return sum + Math.min(counts[kind], caps[kind] / weights[kind]) * weights[kind];
  }, 0);
}

function strengthOf(items: ExpertiseEvidence[], support: number): EvidenceStrength {
  const kinds = sourceKinds(items);
  const works = items.filter(
    (item) => item.source === "publication" || item.source === "research_project",
  ).length;
  if (works < 1) return "insufficient";
  if (support >= 9 && works >= 3) return "strong";
  if (support >= 9 && kinds.length >= 2 && works >= 2) return "strong";
  if (support >= 3) return "moderate";
  return "insufficient";
}

function isPrimary(items: ExpertiseEvidence[], support: number): boolean {
  if (support < 6) return false;
  const publications = items.filter((item) => item.source === "publication").length;
  const projects = items.filter((item) => item.source === "research_project").length;
  const manual = items.some((item) => item.source === "research_interest");
  if (publications >= 2) return true;
  if (projects >= 2) return true;
  if (publications >= 1 && projects >= 1) return true;
  if (publications >= 1 && manual) return true;
  return false;
}

function rationaleFor(topic: string, items: ExpertiseEvidence[], primary: boolean): string {
  const titles = items
    .filter((item) => item.source === "publication" || item.source === "research_project")
    .slice(0, 3)
    .map((item) => item.label);
  const sources = sourceKinds(items).join(", ");
  const level = primary ? "ความเชี่ยวชาญหลัก" : "ความสนใจรอง";
  const examples = titles.length ? ` ตัวอย่างหลักฐาน: ${titles.join("; ")}` : "";
  return `จัดเป็น${level} เพราะมีหลักฐานสอดคล้อง ${items.length} รายการจาก ${sources || "แหล่งข้อมูลที่มี"}.${examples}`;
}

function collectEvidence(record: ExpertiseSourceRecord): {
  items: EvidenceItem[];
  duplicatePublications: number;
  publicationCount: number;
} {
  const items: EvidenceItem[] = [];
  const seenTitles = new Set<string>();
  let duplicatePublications = 0;

  record.publications.forEach((publication, index) => {
    const key = normalize(publication.title);
    if (!key) return;
    if (seenTitles.has(key)) {
      duplicatePublications += 1;
      return;
    }
    seenTitles.add(key);
    items.push({
      id: `pub:${publication.id || index + 1}`,
      source: "publication",
      label: publication.year ? `${publication.title} (${publication.year})` : publication.title,
      text: publication.title,
    });
  });

  record.projects.forEach((project, index) => {
    const title = project.title.trim();
    if (!title) return;
    items.push({
      id: `proj:${project.id || index + 1}`,
      source: "research_project",
      label: project.role ? `${title} (${project.role})` : title,
      text: title,
    });
  });

  record.manualExpertise.forEach((expertise, index) => {
    const text = expertise.trim();
    if (!text) return;
    items.push({
      id: `exp:${index + 1}`,
      source: "research_interest",
      label: text,
      text,
    });
  });

  record.keywords.forEach((keyword, index) => {
    const text = keyword.trim();
    if (!text) return;
    items.push({
      id: `kw:${index + 1}`,
      source: "keyword",
      label: text,
      text,
    });
  });

  record.degrees.forEach((degree, index) => {
    const text = degree.trim();
    if (!text) return;
    items.push({
      id: `deg:${index + 1}`,
      source: "academic_background",
      label: text,
      text,
    });
  });

  return {
    items,
    duplicatePublications,
    publicationCount: seenTitles.size,
  };
}

function matchingEvidence(seed: string, items: EvidenceItem[]): ExpertiseEvidence[] {
  return uniqueEvidence(
    items
      .filter((item) => phraseAppears(seed, item.text) || aliasKey(seed) === aliasKey(item.text))
      .map(({ id, source, label }) => ({ id, source, label })),
  );
}

function draftsFromSeeds(seeds: string[], items: EvidenceItem[]): TopicDraft[] {
  const covered = new Set<string>();
  const drafts: TopicDraft[] = [];

  for (const seed of seeds) {
    const key = aliasKey(seed);
    if (!key || covered.has(key)) continue;
    const evidence = matchingEvidence(seed, items);
    const hasWork = evidence.some(
      (item) => item.source === "publication" || item.source === "research_project",
    );
    const hasClaim = evidence.some(
      (item) => item.source === "research_interest" || item.source === "keyword",
    );
    if (!hasWork && !(hasClaim && evidence.length >= 2)) continue;
    covered.add(key);
    drafts.push({ topic: seed.trim(), evidence });
  }

  return drafts;
}

function contentTokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9\u0E00-\u0E7F]+/i)
    .filter((token) => token.length >= 4 && !LATIN_STOPWORDS.has(token));
}

function repeatedPublicationTopics(items: EvidenceItem[], existing: TopicDraft[]): TopicDraft[] {
  const publications = items.filter((item) => item.source === "publication");
  const counts = new Map<string, ExpertiseEvidence[]>();

  for (const publication of publications) {
    const tokens = contentTokens(publication.text);
    const phrases = new Set<string>();
    for (let index = 0; index < tokens.length - 1; index += 1) {
      phrases.add(`${tokens[index]} ${tokens[index + 1]}`);
    }
    for (const phrase of phrases) {
      const list = counts.get(phrase) ?? [];
      list.push({ id: publication.id, source: publication.source, label: publication.label });
      counts.set(phrase, list);
    }
  }

  const drafts: TopicDraft[] = [];
  for (const [phrase, evidence] of counts) {
    if (evidence.length < 3) continue;
    const alreadyCovered = existing.some((draft) => normalize(draft.topic).includes(phrase));
    if (alreadyCovered) continue;
    drafts.push({
      topic: phrase,
      evidence: uniqueEvidence(evidence),
    });
  }

  return drafts;
}

function classify(drafts: TopicDraft[]): {
  primary: ExpertiseTopic[];
  secondary: ExpertiseTopic[];
  dropped: string[];
} {
  const primary: ExpertiseTopic[] = [];
  const secondary: ExpertiseTopic[] = [];
  const dropped: string[] = [];

  const ranked = drafts
    .map((draft) => {
      const evidence = uniqueEvidence(draft.evidence);
      const support = supportOf(evidence);
      return { draft, evidence, support, strength: strengthOf(evidence, support) };
    })
    .sort((a, b) => b.support - a.support);

  for (const item of ranked) {
    if (item.strength === "insufficient" || item.evidence.length < 2) {
      dropped.push(item.draft.topic);
      continue;
    }
    const primaryEligible = isPrimary(item.evidence, item.support) && item.strength !== "insufficient";
    const topic: ExpertiseTopic = {
      topic: item.draft.topic,
      confidence: confidenceFromSupport(item.support),
      evidence_count: item.evidence.length,
      evidence_sources: sourceKinds(item.evidence),
      strength: item.strength,
      rationale: rationaleFor(item.draft.topic, item.evidence, primaryEligible),
      evidence: item.evidence,
    };
    if (primaryEligible && primary.length < 4) {
      primary.push(topic);
    } else if (secondary.length < 6) {
      topic.rationale = rationaleFor(item.draft.topic, item.evidence, false);
      secondary.push(topic);
    } else {
      dropped.push(item.draft.topic);
    }
  }

  return { primary, secondary, dropped };
}

function facetLabels(
  lexicon: Array<{ label: string; patterns: string[] }>,
  items: EvidenceItem[],
  manualExpertise: string[],
): { labels: string[]; evidence: ExpertiseEvidence[] } {
  const labels: string[] = [];
  const evidence: ExpertiseEvidence[] = [];
  const manualNorm = manualExpertise.map((item) => normalize(item)).join(" \n ");

  for (const entry of lexicon) {
    const hits = items.filter((item) =>
      entry.patterns.some((pattern) => normalize(item.text).includes(normalize(pattern))),
    );
    const claimed = entry.patterns.some((pattern) => manualNorm.includes(normalize(pattern)));
    const distinctWorks = new Set(
      hits
        .filter((item) => item.source === "publication" || item.source === "research_project")
        .map((item) => item.id),
    );
    if (distinctWorks.size < 2 && !claimed) continue;
    if (!hits.length && !claimed) continue;
    labels.push(entry.label);
    evidence.push(
      ...hits.slice(0, 4).map(({ id, source, label }) => ({ id, source, label })),
    );
  }

  return { labels, evidence: uniqueEvidence(evidence) };
}

export function sourceFingerprint(record: ExpertiseSourceRecord): string {
  const payload = JSON.stringify({
    department: record.department,
    degrees: record.degrees,
    manualExpertise: record.manualExpertise,
    keywords: record.keywords,
    publications: record.publications.map((item) => [item.id, item.title, item.year]),
    projects: record.projects.map((item) => [item.id, item.title, item.role]),
  });
  let hash = 5381;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash * 33) ^ payload.charCodeAt(index);
  }
  return `ew1-${(hash >>> 0).toString(16)}`;
}

export function buildExpertiseProfile(
  record: ExpertiseSourceRecord,
  analyzedAt = new Date().toISOString(),
): ExpertiseProfile {
  const collected = collectEvidence(record);
  const seeds = [...record.manualExpertise, ...record.keywords];
  const seeded = draftsFromSeeds(seeds, collected.items);
  const repeated = repeatedPublicationTopics(collected.items, seeded);
  const classified = classify([...seeded, ...repeated]);
  const methods = facetLabels(METHOD_LEXICON, collected.items, record.manualExpertise);
  const geography = facetLabels(GEOGRAPHY_LEXICON, collected.items, record.manualExpertise);
  const populations = facetLabels(POPULATION_LEXICON, collected.items, record.manualExpertise);
  const departmentDomain = DEPARTMENT_DOMAINS[record.department];
  const domains = departmentDomain ? [departmentDomain] : [];
  const domainEvidence: ExpertiseEvidence[] = departmentDomain
    ? [
        {
          id: "dept:1",
          source: "academic_background",
          label: record.department,
        },
      ]
    : [];

  const status =
    classified.primary.length || classified.secondary.length
      ? "ai_analyzed"
      : "insufficient_evidence";

  return {
    researcher_id: record.researcherId,
    expertise_profile: {
      primary_expertise: classified.primary,
      secondary_expertise: classified.secondary,
      research_methods: methods.labels,
      geographical_focus: geography.labels,
      target_populations: populations.labels,
      research_domains: domains,
    },
    evidence_summary: {
      total_publications_analyzed: collected.publicationCount,
      total_projects_analyzed: record.projects.filter((item) => item.title.trim()).length,
      total_research_interests: record.manualExpertise.filter((item) => item.trim()).length,
      duplicate_publications_collapsed: collected.duplicatePublications,
      dropped_single_mentions: classified.dropped,
    },
    facet_evidence: {
      research_methods: methods.evidence,
      geographical_focus: geography.evidence,
      target_populations: populations.evidence,
      research_domains: domainEvidence,
    },
    analysis_status: status,
    last_analyzed_at: analyzedAt,
    model_version: DETERMINISTIC_MODEL_VERSION,
    confidence_method: CONFIDENCE_METHOD,
  };
}

export function evidenceIndex(profile: ExpertiseProfile): Map<string, ExpertiseEvidence> {
  const index = new Map<string, ExpertiseEvidence>();
  for (const topic of [
    ...profile.expertise_profile.primary_expertise,
    ...profile.expertise_profile.secondary_expertise,
  ]) {
    for (const item of topic.evidence) index.set(item.id, item);
  }
  for (const group of Object.values(profile.facet_evidence)) {
    for (const item of group) index.set(item.id, item);
  }
  return index;
}
